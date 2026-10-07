import { Readable } from 'node:stream'
const make = (s, chunks, size) => Array.from({ length: chunks }, (_, c) => {
  const b = Buffer.allocUnsafe(size)
  for (let j = 0; j < size; j++) b[j] = (s * 31 + c * 7 + j * 3) & 255
  return b
})
export async function operation({ sources, chunks, size }) {
  const streams = Array.from({ length: sources }, (_, s) => Readable.from(make(s, chunks, size), { objectMode: false }))
  async function* concat() {
    for (const stream of streams) yield* stream
  }
  const out = []
  for await (const chunk of concat()) out.push(chunk)
  return out
}
