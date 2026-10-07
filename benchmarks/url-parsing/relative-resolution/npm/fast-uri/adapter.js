import fastUri from 'fast-uri'
export const operation = ([base, ref]) => fastUri.resolve(base, ref)
