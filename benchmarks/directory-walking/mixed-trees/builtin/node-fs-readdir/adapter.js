import { readdirSync } from 'node:fs'

export const operation = ({ root }) => readdirSync(root, { recursive: true })
