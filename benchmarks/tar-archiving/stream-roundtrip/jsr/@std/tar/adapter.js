import { TarStream, UntarStream } from '@std/tar'

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

const collect = async (stream) => {
  const reader = stream.getReader()
  const chunks = []
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return concat(chunks)
}

export async function operation(files) {
  const inputs = files.map(({ name, text }) => {
    const bytes = encoder.encode(text)
    return {
      type: 'file',
      path: name,
      size: bytes.length,
      readable: ReadableStream.from(bytes.length ? [bytes] : []),
      options: { mode: 0o644, mtime: 0 },
    }
  })
  const archive = await collect(ReadableStream.from(inputs).pipeThrough(new TarStream()))

  const entries = []
  for await (const entry of ReadableStream.from([archive]).pipeThrough(new UntarStream())) {
    const body = entry.readable ? await collect(entry.readable) : new Uint8Array(0)
    entries.push({ name: entry.path, text: decoder.decode(body) })
  }
  return { entries, archive }
}
