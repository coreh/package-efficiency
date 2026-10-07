import { z } from 'zod'
const schema = z.object({
  id: z.number().int().min(1),
  name: z.string().min(1),
  email: z.string(),
  role: z.enum(['admin', 'editor', 'viewer']),
  active: z.boolean(),
  tags: z.array(z.string()),
  scores: z.array(z.number()),
  nickname: z.string().optional(),
  address: z.object({
    city: z.string().min(1),
    zip: z.string(),
    geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  }),
})
export const operation = doc => schema.safeParse(doc).success
