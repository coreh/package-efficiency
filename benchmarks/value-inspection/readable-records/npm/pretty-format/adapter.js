import { createRequire } from 'node:module'
// Loaded through its CommonJS entry: Bun's ESM wrapper (build/index.mjs) leaves `format` undefined.
const { format } = createRequire(import.meta.url)('pretty-format')
export const operation = (value) => format(value)
