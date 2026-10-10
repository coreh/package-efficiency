import { walk } from '@nodelib/fs.walk'

export const operation = ({ root }) =>
  new Promise((resolve, reject) => {
    walk(root, (error, entries) => {
      if (error) reject(error)
      else resolve(entries.map((entry) => entry.path))
    })
  })
