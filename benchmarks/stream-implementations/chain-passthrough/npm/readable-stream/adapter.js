import { PassThrough } from 'readable-stream'

export async function operation({ chunks, size, depth }) {
  const streams = Array.from({ length: depth }, () => new PassThrough())
  for (let i = 1; i < depth; i++) streams[i - 1].pipe(streams[i])
  const head = streams[0], tail = streams[depth - 1]
  let bytes = 0, count = 0, checksum = 0
  const done = new Promise((resolve, reject) => {
    tail.on('data', (c) => {
      const n = c.length
      bytes += n
      count++
      checksum = (checksum * 131 + n + c[0] * 3 + c[n >> 1] * 5 + c[n - 1] * 7) % 2147483647
    })
    tail.on('end', resolve)
    tail.on('error', reject)
  })
  for (let i = 0; i < chunks; i++) {
    const chunk = Buffer.alloc(size, i & 255)
    chunk[0] = (i * 7 + 5) & 255
    chunk[size - 1] = (i * 13 + 1) & 255
    if (head.write(chunk) === false) await new Promise((resolve) => head.once('drain', resolve))
  }
  head.end()
  await done
  return { bytes, count, checksum }
}
