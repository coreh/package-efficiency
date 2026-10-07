import { deflateSync, strToU8 } from 'fflate'
export const operation = (text) => deflateSync(strToU8(text))
