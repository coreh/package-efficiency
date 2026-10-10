import { ZipWriter, ZipReader, Uint8ArrayReader, Uint8ArrayWriter } from '@zip-js/zip-js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function operation(files) {
  const writer = new ZipWriter(new Uint8ArrayWriter(), { useWebWorkers: false })
  for (const { name, text } of files) await writer.add(name, new Uint8ArrayReader(encoder.encode(text)))
  const archive = await writer.close()
  const reader = new ZipReader(new Uint8ArrayReader(archive), { useWebWorkers: false })
  const entries = []
  for (const entry of await reader.getEntries()) {
    entries.push({ name: entry.filename, text: decoder.decode(await entry.getData(new Uint8ArrayWriter())) })
  }
  await reader.close()
  return { entries, archive }
}
