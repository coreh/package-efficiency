import tar from 'tar-stream'

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
  const pack = tar.pack()
  for (const { name, text } of files) {
    const bytes = encoder.encode(text)
    pack.entry({ name, size: bytes.length, mode: 0o644, mtime: new Date(0) }, bytes)
  }
  pack.finalize()
  const chunks = []
  for await (const chunk of pack) chunks.push(chunk)
  const archive = concat(chunks)

  const extract = tar.extract()
  extract.end(archive)
  const entries = []
  for await (const entry of extract) {
    const body = []
    for await (const chunk of entry) body.push(chunk)
    entries.push({ name: entry.header.name, text: decoder.decode(concat(body)) })
  }
  return { entries, archive }
}
