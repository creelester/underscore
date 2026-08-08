import { z } from "zod";

export const MoodProfileSchema = z.object({
  genre: z.array(z.string()),
  mood: z.array(z.string()),
  pacing: z.enum(["slow", "steady", "fast"]),
  summary: z.string(),
});
export type MoodProfile = z.infer<typeof MoodProfileSchema>;
