import { createPrivateKey, sign } from 'node:crypto'
import { Buffer } from 'node:buffer'
// Untimed, once per fixture: the PEM becomes a KeyObject and the message bytes.
export const prepare = ({ privateKey, message }) => ({ key: createPrivateKey(privateKey), message: Buffer.from(message, 'utf8') })
export const operation = ({ key, message }) => sign('sha256', message, key)
