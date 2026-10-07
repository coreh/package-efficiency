import { createHmac } from 'node:crypto'
export const operation = ({ key, text }) => createHmac('sha256', key).update(text).digest()
