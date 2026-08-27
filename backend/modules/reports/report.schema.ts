import { z } from "zod";

export const createReportSchema = z.object({
  cafeId: z.string().min(1),
  hasNursingRoom: z.boolean().optional(),
  hasDiaperTable: z.boolean().optional(),
  note: z.string().max(500).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
