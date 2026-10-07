import { writeSync } from 'node:fs'
import tmp from 'tmp'

const payload = Buffer.from(Array.from({ length: 1024 }, (_, i) => (i * 7 + 3) & 255))

export function operation({ root, files, dirs, filePrefix, fileSuffix, dirPrefix }) {
  const made = []
  for (let i = 0; i < files; i++) {
    const file = tmp.fileSync({ tmpdir: root, prefix: filePrefix, postfix: fileSuffix })
    writeSync(file.fd, payload)
    made.push(file)
  }
  for (let i = 0; i < dirs; i++) made.push(tmp.dirSync({ tmpdir: root, prefix: dirPrefix }))
  const names = made.map((entry) => entry.name)
  for (const entry of made) entry.removeCallback()
  return names
}
