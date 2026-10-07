import { globbySync } from 'globby'

export const operation = ({ root, patterns }) => patterns.map((pattern) => globbySync(pattern, { cwd: root }))
