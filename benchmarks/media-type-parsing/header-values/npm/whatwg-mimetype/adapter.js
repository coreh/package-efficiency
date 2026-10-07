import { MIMEType } from 'whatwg-mimetype'
export const operation = (text) => {
  const mime = new MIMEType(text)
  return { type: mime.essence, parameters: Object.fromEntries(mime.parameters) }
}
