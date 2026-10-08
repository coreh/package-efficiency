import { Tiktoken } from 'js-tiktoken/lite'
import cl100k_base from 'js-tiktoken/ranks/cl100k_base'
const enc = new Tiktoken(cl100k_base)
export const operation = (text) => {
  const ids = enc.encode(text)
  return { ids, text: enc.decode(ids) }
}
