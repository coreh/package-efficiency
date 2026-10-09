import * as z from '@quentinadam/zod'
const str1 = z.string().refine(s => s.length >= 1, "empty")
const range = (lo, hi) => z.number().refine(n => n >= lo && n <= hi, "out of range")
const schema = z.object({
  id: z.number().refine(n => Number.isInteger(n) && n >= 1, "not a positive integer"),
  name: str1,
  email: z.string(),
  role: z.union([z.literal("admin"), z.literal("editor"), z.literal("viewer")]),
  active: z.boolean(),
  tags: z.array(z.string()),
  scores: z.array(z.number()),
  nickname: z.optional(z.string()),
  address: z.object({
    city: str1,
    zip: z.string(),
    geo: z.optional(z.object({ lat: range(-90, 90), lng: range(-180, 180) })),
  }),
})
export const operation = doc => {
  const r = schema.safeParse(doc)
  return r.success ? '' : '/' + r.errors[0].path.join('/')
}
