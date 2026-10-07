import { walkSync } from '@nodelib/fs.walk'

export const operation = ({ root }) => walkSync(root).map((entry) => entry.path)
