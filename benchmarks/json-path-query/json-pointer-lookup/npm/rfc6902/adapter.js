import { Pointer } from 'rfc6902'
export const operation = ({ document, pointers }) => pointers.map((pointer) => Pointer.fromJSON(pointer).get(document) ?? null)
