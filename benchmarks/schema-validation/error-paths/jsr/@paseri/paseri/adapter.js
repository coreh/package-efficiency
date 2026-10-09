import * as p from '@paseri/paseri'
const schema = p.object({
  id: p.number().int().gte(1),
  name: p.string().min(1),
  email: p.string(),
  role: p.enum("admin", "editor", "viewer"),
  active: p.boolean(),
  tags: p.array(p.string()),
  scores: p.array(p.number()),
  nickname: p.string().optional(),
  address: p.object({
    city: p.string().min(1),
    zip: p.string(),
    geo: p.object({ lat: p.number().gte(-90).lte(90), lng: p.number().gte(-180).lte(180) }).optional(),
  }),
})
export const operation = doc => {
  const r = schema.safeParse(doc)
  return r.ok ? '' : '/' + r.messages()[0].path.join('/')
}
