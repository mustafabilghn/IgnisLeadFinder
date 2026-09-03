import { z } from "zod";

export const searchQuerySchema = z.object({
  country: z.string().trim().min(1, "Ülke zorunludur").max(100),
  city: z.string().trim().min(1, "Şehir zorunludur").max(100),
  district: z.string().trim().max(100).optional(),
  category: z.string().trim().min(1, "Sektör/kategori zorunludur").max(150),
  maxResults: z.coerce.number().int().min(1).max(60),
});

export const leadPatchSchema = z.object({
  status: z.enum(["new", "contacted", "interested", "meeting", "won", "lost"]).optional(),
  notes: z.string().max(5000).optional(),
});
