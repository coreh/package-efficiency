import { MIMEType } from 'whatwg-mimetype'
export const operation = (input) => {
  const mime = new MIMEType(input.type)
  for (const name in input.parameters) mime.parameters.set(name, input.parameters[name])
  return mime.toString()
}
