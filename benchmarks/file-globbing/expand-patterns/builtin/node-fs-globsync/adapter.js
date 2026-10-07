import { globSync } from 'node:fs'

export const operation = ({ root, patterns }) => patterns.map((pattern) => globSync(pattern, { cwd: root }))
