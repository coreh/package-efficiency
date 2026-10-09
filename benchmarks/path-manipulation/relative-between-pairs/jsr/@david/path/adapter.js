import { Path } from '@david/path'
export const operation = ([from, to]) => new Path(from).relative(to)
