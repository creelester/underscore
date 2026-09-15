import { z } from "zod";

/** How many tracks Claude is asked for — a JSON schema takes no length bound. */
export const ANCHOR_COUNT = 20;

export const AnchorSuggestionSchema = z.object({
  artist: z.string(),
  title: z.string(),
});
export type AnchorSuggestion = z.infer<typeof AnchorSuggestionSchema>;

export const AnchorSuggestionsSchema = z.array(AnchorSuggestionSchema);
