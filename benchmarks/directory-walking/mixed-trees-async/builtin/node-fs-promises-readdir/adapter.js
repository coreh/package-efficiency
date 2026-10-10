import { readdir } from 'node:fs/promises'

export const operation = ({ root }) => readdir(root, { recursive: true })
