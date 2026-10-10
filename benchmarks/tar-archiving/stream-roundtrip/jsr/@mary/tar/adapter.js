import { untar, writeTarEntry } from '@mary/tar'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const concat = (chunks) => {
  let length = 0
  for (const chunk of chunks) length += chunk.length
  const out = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length }
  return out
}

export async function operation(files) {
  const buffers = files.map(({ name, text }) =>
    writeTarEntry({ filename: name, data: encoder.encode(text), attrs: { mode: 0o644, mtime: 0 } }))
  // The package has no end-of-archive writer: two zero blocks end the archive.
  buffers.push(new Uint8Array(1024))
  const reader = ReadableStream.from(buffers).getReader()
  const chunks = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  const archive = concat(chunks)

  const entries = []
  for await (const entry of untar(ReadableStream.from([archive]))) {
    entries.push({ name: entry.name, text: decoder.decode(await entry.bytes()) })
  }
  return { entries, archive }
}
