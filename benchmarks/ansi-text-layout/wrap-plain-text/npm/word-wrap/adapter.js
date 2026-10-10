import wrap from 'word-wrap'
export const operation = ({ text, width }) => wrap(text, { width, indent: '', trim: true })
