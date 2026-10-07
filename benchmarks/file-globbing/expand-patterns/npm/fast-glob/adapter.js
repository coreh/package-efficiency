import fg from 'fast-glob'

export const operation = ({ root, patterns }) => patterns.map((pattern) => fg.sync(pattern, { cwd: root }))
