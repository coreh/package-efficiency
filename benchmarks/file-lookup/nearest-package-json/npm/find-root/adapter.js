import { join } from 'node:path'
import findRoot from 'find-root'

export const operation = ({ starts }) => starts.map((start) => join(findRoot(start), 'package.json'))
