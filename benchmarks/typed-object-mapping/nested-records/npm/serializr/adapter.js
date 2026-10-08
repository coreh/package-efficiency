import { createModelSchema, primitive, list, object, deserialize, serialize } from 'serializr'

class Customer {}
class Line {}
class Order {}
createModelSchema(Customer, { name: primitive(), age: primitive(), score: primitive(), active: primitive(), nickname: primitive() })
createModelSchema(Line, { sku: primitive(), qty: primitive(), price: primitive(), gift: primitive(), comment: primitive() })
createModelSchema(Order, {
  id: primitive(),
  ref: primitive(),
  total: primitive(),
  paid: primitive(),
  note: primitive(),
  tags: list(primitive()),
  customer: object(Customer),
  lines: list(object(Line)),
})

export const operation = (input) => {
  const record = deserialize(Order, input)
  return [record, serialize(record)]
}
