import { z } from "zod";

export const searchQuerySchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(100),
  city: z.string().trim().min(1, "City is required").max(100),
  district: z.string().trim().max(100).optional(),
  category: z.string().trim().min(1, "Industry/category is required").max(150),
  maxResults: z.coerce.number().int().min(1).max(60),
});

export const leadPatchSchema = z.object({
  status: z.enum(["new", "contacted", "interested", "meeting", "won", "lost"]).optional(),
  notes: z.string().max(5000).optional(),
});
