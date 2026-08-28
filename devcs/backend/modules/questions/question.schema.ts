import { z } from "zod";

export const questionCategorySchema = z.enum([
  "DATA_STRUCTURE",
  "ALGORITHM",
  "NETWORK",
  "OPERATING_SYSTEM",
  "DATABASE",
  "WEB",
  "ETC",
]);

export const listQuestionsQuerySchema = z.object({
  category: questionCategorySchema.optional(),
});

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
