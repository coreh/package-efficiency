import wrapAnsi from 'wrap-ansi'
export const operation = ({ text, width }) => wrapAnsi(text, width, { hard: false, trim: true })
