import { z } from "zod";

export const exploreQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.string().trim().max(80).optional(),
  category: z.string().trim().max(80).optional(),
  audience: z.string().trim().max(80).optional(),
  genre: z.string().trim().max(80).optional(),
  liveMusic: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  promotion: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((value) => value === true || value === "true"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["relevance", "date", "name"]).default("relevance"),
});

export type ExploreQuery = z.infer<typeof exploreQuerySchema>;
