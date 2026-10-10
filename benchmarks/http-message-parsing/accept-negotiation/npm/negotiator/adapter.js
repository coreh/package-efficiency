import Negotiator from 'negotiator'
export const operation = (accept) => new Negotiator({ headers: { accept } }).mediaTypes()
