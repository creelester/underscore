import { z } from "zod";

export const AnchorSuggestionSchema = z.object({
  artist: z.string(),
  title: z.string(),
});
export type AnchorSuggestion = z.infer<typeof AnchorSuggestionSchema>;

export const AnchorSuggestionsSchema = z.array(AnchorSuggestionSchema);
