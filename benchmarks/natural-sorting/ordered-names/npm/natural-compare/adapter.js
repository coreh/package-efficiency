import naturalCompare from 'natural-compare'
export const operation = (list) => list.slice().sort(naturalCompare)
