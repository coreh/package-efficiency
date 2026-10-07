import mime from 'mime-types'
export const operation = (type) => mime.extension(type)
