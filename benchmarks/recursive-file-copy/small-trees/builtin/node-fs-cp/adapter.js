import { cpSync } from 'node:fs'

export const operation = ({ from, to }) => cpSync(from, to, { recursive: true })
