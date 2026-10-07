import { expandGlobSync } from '@std/fs'

export const operation = ({ root, patterns }) => patterns.map((pattern) => Array.from(expandGlobSync(pattern, { root }), (entry) => entry.path))
