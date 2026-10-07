import writeFileAtomic from 'write-file-atomic'

export const operation = ({ files }) => {
  for (const file of files) writeFileAtomic.sync(file.path, file.content)
}
