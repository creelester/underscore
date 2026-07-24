import { z } from "zod";

export const MoodProfileSchema = z.object({
  genre: z.string(),
  mood: z.string(),
  energy: z.enum(["low", "medium", "high"]),
  summary: z.string(),
});
export type MoodProfile = z.infer<typeof MoodProfileSchema>;
