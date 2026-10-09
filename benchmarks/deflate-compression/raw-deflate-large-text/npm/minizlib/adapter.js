import { DeflateRaw } from 'minizlib'
const encoder = new TextEncoder()
export const operation = (text) => new DeflateRaw().end(encoder.encode(text)).read()
