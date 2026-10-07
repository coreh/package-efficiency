import * as v from '@valibot/valibot'
const schema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  email: v.string(),
  role: v.picklist(['admin', 'editor', 'viewer']),
  active: v.boolean(),
  tags: v.array(v.string()),
  scores: v.array(v.number()),
  nickname: v.optional(v.string()),
  address: v.object({
    city: v.pipe(v.string(), v.minLength(1)),
    zip: v.string(),
    geo: v.optional(v.object({ lat: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)), lng: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)) })),
  }),
})
export const operation = doc => v.is(schema, doc)
