import { z } from "zod";

export const nearbyCafesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().min(0.1).max(20).default(2),
});

export const createCafeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  roadAddress: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  kakaoPlaceId: z.string().optional(),
  hasNursingRoom: z.boolean().default(false),
  hasDiaperTable: z.boolean().default(false),
  facilityNote: z.string().optional(),
});

export type NearbyCafesQuery = z.infer<typeof nearbyCafesQuerySchema>;
export type CreateCafeInput = z.infer<typeof createCafeSchema>;
