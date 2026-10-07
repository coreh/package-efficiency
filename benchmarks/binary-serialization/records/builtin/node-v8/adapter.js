import { deserialize, serialize } from 'node:v8'
export const operation = value => deserialize(serialize(value))
