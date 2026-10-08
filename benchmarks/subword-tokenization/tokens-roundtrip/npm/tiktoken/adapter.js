import { get_encoding } from 'tiktoken'
const enc = get_encoding('cl100k_base')
const utf8 = new TextDecoder()
export const operation = (text) => {
  const ids = enc.encode(text)
  return { ids, text: utf8.decode(enc.decode(ids)) }
}
