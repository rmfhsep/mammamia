import { z } from "zod";

export const articleCategorySchema = z.enum(["AI", "DEV", "DATA"]);

export const listArticlesQuerySchema = z.object({
  category: articleCategorySchema.optional(),
});

export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
