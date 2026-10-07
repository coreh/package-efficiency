import { globSync } from 'glob'

export const operation = ({ root, patterns }) => patterns.map((pattern) => globSync(pattern, { cwd: root }))
