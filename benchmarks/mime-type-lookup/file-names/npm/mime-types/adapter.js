import mime from 'mime-types'
export const operation = (name) => mime.lookup(name)
