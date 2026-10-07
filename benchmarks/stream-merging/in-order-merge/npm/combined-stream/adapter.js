import CombinedStream from 'combined-stream'
import { Readable, Writable } from 'node:stream'
const make = (s, chunks, size) => Array.from({ length: chunks }, (_, c) => {
  const b = Buffer.allocUnsafe(size)
  for (let j = 0; j < size; j++) b[j] = (s * 31 + c * 7 + j * 3) & 255
  return b
})
export function operation({ sources, chunks, size }) {
  const combined = CombinedStream.create()
  for (let s = 0; s < sources; s++) combined.append(Readable.from(make(s, chunks, size), { objectMode: false }))
  const out = []
  return new Promise((resolve, reject) => {
    combined.on('error', reject)
    combined.pipe(new Writable({
      write(chunk, _encoding, done) { out.push(chunk); done() },
      final(done) { done(); resolve(out) },
    }))
  })
}
