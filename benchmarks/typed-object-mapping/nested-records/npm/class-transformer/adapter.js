import 'reflect-metadata'
import { plainToInstance, instanceToPlain, Type } from 'class-transformer'

class Customer {}
class Line {}
class Order {}
Type(() => Customer)(Order.prototype, 'customer')
Type(() => Line)(Order.prototype, 'lines')

export const operation = (input) => {
  const record = plainToInstance(Order, input)
  return [record, instanceToPlain(record)]
}
