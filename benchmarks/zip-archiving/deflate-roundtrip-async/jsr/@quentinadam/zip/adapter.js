import { create, extract } from '@quentinadam/zip'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function operation(files) {
  const archive = await create(files.map(({ name, text }) => ({ name, data: encoder.encode(text) })))
  const entries = (await extract(archive)).map(({ name, data }) => ({ name, text: decoder.decode(data) }))
  return { entries, archive }
}
