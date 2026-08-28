import { z } from "zod";

export const submitSolveSchema = z.object({
  deviceId: z.string().min(1),
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(4),
});

export const listSolvesQuerySchema = z.object({
  deviceId: z.string().min(1),
});

export type SubmitSolveInput = z.infer<typeof submitSolveSchema>;
export type ListSolvesQuery = z.infer<typeof listSolvesQuerySchema>;
