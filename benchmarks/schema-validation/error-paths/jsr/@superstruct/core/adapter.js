import { object, string, number, integer, min, max, size, boolean, array, optional, enums, is, validate } from '@superstruct/core'
const schema = object({
  id: min(integer(), 1),
  name: size(string(), 1, Infinity),
  email: string(),
  role: enums(['admin', 'editor', 'viewer']),
  active: boolean(),
  tags: array(string()),
  scores: array(number()),
  nickname: optional(string()),
  address: object({
    city: size(string(), 1, Infinity),
    zip: string(),
    geo: optional(object({ lat: max(min(number(), -90), 90), lng: max(min(number(), -180), 180) })),
  }),
})
export const operation = doc => {
  const [error] = validate(doc, schema)
  return error ? '/' + error.path.join('/') : ''
}
