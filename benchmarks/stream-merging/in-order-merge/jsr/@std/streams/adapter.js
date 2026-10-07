import { concatReadableStreams } from '@std/streams'
const make = (s, chunks, size) => Array.from({ length: chunks }, (_, c) => {
  const b = Buffer.allocUnsafe(size)
  for (let j = 0; j < size; j++) b[j] = (s * 31 + c * 7 + j * 3) & 255
  return b
})
export async function operation({ sources, chunks, size }) {
  const streams = Array.from({ length: sources }, (_, s) => ReadableStream.from(make(s, chunks, size)))
  const out = []
  const reader = concatReadableStreams(...streams).getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out.push(value)
  }
  return out
}
