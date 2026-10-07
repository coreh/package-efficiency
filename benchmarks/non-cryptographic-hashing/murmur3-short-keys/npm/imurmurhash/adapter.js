import MurmurHash3 from 'imurmurhash'
export const operation = (input) => MurmurHash3(input).result() >>> 0
