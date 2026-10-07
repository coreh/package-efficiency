import escalade from 'escalade/sync'

const find = (dir, names) => names.includes('package.json') && 'package.json'

export const operation = ({ starts }) => starts.map((start) => escalade(start, find))
