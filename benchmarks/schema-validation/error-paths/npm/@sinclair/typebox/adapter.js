import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
const schema = Type.Object({
  id: Type.Integer({ minimum: 1 }),
  name: Type.String({ minLength: 1 }),
  email: Type.String(),
  role: Type.Union([Type.Literal('admin'), Type.Literal('editor'), Type.Literal('viewer')]),
  active: Type.Boolean(),
  tags: Type.Array(Type.String()),
  scores: Type.Array(Type.Number()),
  nickname: Type.Optional(Type.String()),
  address: Type.Object({
    city: Type.String({ minLength: 1 }),
    zip: Type.String(),
    geo: Type.Optional(Type.Object({ lat: Type.Number({ minimum: -90, maximum: 90 }), lng: Type.Number({ minimum: -180, maximum: 180 }) })),
  }),
})
// Compiled once at setup, as Ajv's schema is.
const check = TypeCompiler.Compile(schema)
export const operation = doc => (check.Check(doc) ? '' : check.Errors(doc).First().path)
