import { deflateRaw } from 'pako'
const encoder = new TextEncoder()
export const operation = (text) => deflateRaw(encoder.encode(text))
