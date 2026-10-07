import { matchesGlob } from 'node:path'
export const operation = ({ pattern, paths }) => paths.map((p) => matchesGlob(p, pattern))
