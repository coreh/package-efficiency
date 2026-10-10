import { zip, unzip } from 'fflate'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function operation(files) {
  const input = {}
  for (const { name, text } of files) input[name] = encoder.encode(text)
  const archive = await new Promise((resolve, reject) => zip(input, (error, data) => (error ? reject(error) : resolve(data))))
  const unzipped = await new Promise((resolve, reject) => unzip(archive, (error, data) => (error ? reject(error) : resolve(data))))
  const entries = Object.entries(unzipped).map(([name, data]) => ({ name, text: decoder.decode(data) }))
  return { entries, archive }
}
