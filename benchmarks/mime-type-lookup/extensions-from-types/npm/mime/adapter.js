import mime from 'mime'
export const operation = (type) => mime.getExtension(type)
