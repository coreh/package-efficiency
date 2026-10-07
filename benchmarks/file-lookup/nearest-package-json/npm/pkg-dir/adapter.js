import { join } from 'node:path'
import { packageDirectorySync } from 'pkg-dir'

export const operation = ({ starts }) => starts.map((cwd) => join(packageDirectorySync({ cwd }), 'package.json'))
