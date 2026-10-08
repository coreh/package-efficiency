import { encode, decode } from 'gpt-tokenizer/encoding/cl100k_base'
export const operation = (text) => {
  const ids = encode(text)
  return { ids, text: decode(ids) }
}
