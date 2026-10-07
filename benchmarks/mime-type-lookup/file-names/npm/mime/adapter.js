import mime from 'mime'
export const operation = (name) => mime.getType(name)
