import { typeByExtension } from '@std/media-types'
export const operation = (name) => typeByExtension(name.slice(name.lastIndexOf('.') + 1))
