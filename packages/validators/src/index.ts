import { z } from "zod";

export const CreatePostSchema = z.object({
  content: z.string(),
  title: z.string(),
});
