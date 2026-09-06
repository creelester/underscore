import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  AnchorSuggestionsSchema,
  MOODS,
  MoodProfileSchema,
  type AnchorSuggestion,
  type BookDetail,
  type MoodProfile,
} from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { ANCHOR_SYSTEM, MOOD_SYSTEM, anchorPrompt, moodPrompt } from "./prompts";

const MODEL = "claude-opus-5";

/** Without it a policy decline ends a generation outright; `"default"` routes the retry. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/** Everything on a profile except `genre`, which comes from Google's categories. */
const MoodAnalysisSchema = MoodProfileSchema.omit({ genre: true });
export type MoodAnalysis = z.infer<typeof MoodAnalysisSchema>;

const AnchorResponseSchema = z.object({ tracks: AnchorSuggestionsSchema });

/**
 * The enum keeps Claude inside the closed vocabulary the UI has gradients for; the cap
 * of two lives in the prompt, since a JSON schema here takes no length bound. Both are
 * steers, so `requestStructured`'s zod parse is what actually enforces them.
 */
const MOOD_ANALYSIS_FORMAT: Anthropic.JSONOutputFormat = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      mood: { type: "array", items: { type: "string", enum: [...MOODS] } },
      pacing: { type: "string", enum: ["slow", "steady", "fast"] },
      summary: { type: "string" },
    },
    required: ["mood", "pacing", "summary"],
    additionalProperties: false,
  },
};

// Structured output must be a JSON object, hence the `tracks` wrapper around the list.
const ANCHORS_FORMAT: Anthropic.JSONOutputFormat = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      tracks: {
        type: "array",
        items: {
          type: "object",
          properties: { artist: { type: "string" }, title: { type: "string" } },
          required: ["artist", "title"],
          additionalProperties: false,
        },
      },
    },
    required: ["tracks"],
    additionalProperties: false,
  },
};

let client: Anthropic | null = null;

function anthropic(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw ApiError.upstreamUnavailable("Claude is not configured");
  }
  client ??= new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    baseURL: env.ANTHROPIC_BASE_URL,
  });
  return client;
}

type StructuredRequest<T> = {
  /** Named in the message of any UPSTREAM_UNAVAILABLE this raises. */
  label: string;
  system: string;
  prompt: string;
  format: Anthropic.JSONOutputFormat;
  effort: "low" | "medium";
  maxTokens: number;
  schema: z.ZodType<T>;
};

async function createMessage(
  request: Omit<StructuredRequest<unknown>, "label" | "schema">,
): Promise<Anthropic.Beta.BetaMessage> {
  try {
    return await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: request.maxTokens,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: request.system,
      output_config: { effort: request.effort, format: request.format },
      messages: [{ role: "user", content: request.prompt }],
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      // Not the error itself as `cause`: it carries the request headers, api key
      // included, and the terminal handler in app.ts logs causes.
      throw ApiError.upstreamUnavailable(`Claude responded ${error.status ?? "with an error"}`, {
        status: error.status,
        name: error.name,
      });
    }
    throw error;
  }
}

/** Null when the turn carried no text block, or text that is not JSON. */
function readJson(message: Anthropic.Beta.BetaMessage): unknown {
  const text = message.content.find((block) => block.type === "text")?.text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** One retry on an unusable shape. A refusal is not retried; the answer would not change. */
async function requestStructured<T>({ label, schema, ...request }: StructuredRequest<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const message = await createMessage(request);
    if (message.stop_reason === "refusal") {
      throw ApiError.upstreamUnavailable(`Claude declined to produce a ${label}`, message.stop_details);
    }

    const parsed = schema.safeParse(readJson(message));
    if (parsed.success) return parsed.data;
    lastError = parsed.error;
  }

  throw ApiError.upstreamUnavailable(`Claude returned an unusable ${label}`, lastError);
}

export async function analyzeMood(book: BookDetail): Promise<MoodAnalysis> {
  return requestStructured({
    label: "mood profile",
    system: MOOD_SYSTEM,
    prompt: moodPrompt(book),
    format: MOOD_ANALYSIS_FORMAT,
    // Reading a mood off a blurb is a light task; the effort is better spent on tracks.
    effort: "low",
    maxTokens: 2000,
    schema: MoodAnalysisSchema,
  });
}

/** ~30 anchors for a profile. `book` is absent on the manual-genre path. */
export async function suggestAnchors(
  profile: MoodProfile,
  book?: Pick<BookDetail, "title" | "authors">,
): Promise<AnchorSuggestion[]> {
  const { tracks } = await requestStructured({
    label: "track list",
    system: ANCHOR_SYSTEM,
    prompt: anchorPrompt(profile, book),
    format: ANCHORS_FORMAT,
    // Recalling real catalogue entries is where the quality of a playlist is decided.
    effort: "medium",
    maxTokens: 8000,
    schema: AnchorResponseSchema,
  });

  return tracks;
}
