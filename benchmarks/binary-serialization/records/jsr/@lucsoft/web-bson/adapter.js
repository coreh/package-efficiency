import { deserialize, serialize } from '@lucsoft/web-bson'
// BSON documents are objects, so the record travels as the field v.
export const operation = value => deserialize(serialize({ v: value })).v
