import { createTempDirSync, createTempFileSync } from '@david/temp'

const payload = new Uint8Array(1024).map((_, i) => (i * 7 + 3) & 255)

export function operation({ root, files, dirs, filePrefix, fileSuffix, dirPrefix }) {
  const made = []
  for (let i = 0; i < files; i++) {
    const file = createTempFileSync({ dir: root, prefix: filePrefix, suffix: fileSuffix })
    file.writeSync(payload)
    made.push(file)
  }
  for (let i = 0; i < dirs; i++) made.push(createTempDirSync({ dir: root, prefix: dirPrefix }))
  const names = made.map((entry) => String(entry))
  for (const entry of made) entry[Symbol.dispose]()
  return names
}
