import { writeFileSync } from 'atomically'

export const operation = ({ files }) => {
  for (const file of files) writeFileSync(file.path, file.content)
}
