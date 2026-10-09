import * as v from '@badrap/valita'
const str1 = v.string().assert(s => s.length >= 1, "empty")
const range = (lo, hi) => v.number().assert(n => n >= lo && n <= hi, "out of range")
const schema = v.object({
  id: v.number().assert(n => Number.isInteger(n) && n >= 1, "not a positive integer"),
  name: str1,
  email: v.string(),
  role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
  active: v.boolean(),
  tags: v.array(v.string()),
  scores: v.array(v.number()),
  nickname: v.string().optional(),
  address: v.object({
    city: str1,
    zip: v.string(),
    geo: v.object({ lat: range(-90, 90), lng: range(-180, 180) }).optional(),
  }),
})
export const operation = doc => {
  const r = schema.try(doc)
  return r.ok ? '' : '/' + r.issues[0].path.join('/')
}
