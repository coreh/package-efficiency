import { as, is } from '@core/unknownutil'
const nonEmpty = x => is.String(x) && x.length >= 1
const range = (lo, hi) => x => is.Number(x) && x >= lo && x <= hi
const isUser = is.ObjectOf({
  id: x => is.Number(x) && Number.isInteger(x) && x >= 1,
  name: nonEmpty,
  email: is.String,
  role: is.LiteralOneOf(['admin', 'editor', 'viewer']),
  active: is.Boolean,
  tags: is.ArrayOf(is.String),
  scores: is.ArrayOf(is.Number),
  nickname: as.Optional(is.String),
  address: is.ObjectOf({
    city: nonEmpty,
    zip: is.String,
    geo: as.Optional(is.ObjectOf({ lat: range(-90, 90), lng: range(-180, 180) })),
  }),
})
export const operation = doc => isUser(doc)
