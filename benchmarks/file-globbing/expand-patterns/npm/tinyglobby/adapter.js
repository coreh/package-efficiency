import { globSync } from 'tinyglobby'

export const operation = ({ root, patterns }) => patterns.map((pattern) => globSync(pattern, { cwd: root }))
