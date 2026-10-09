import { Path } from '@david/path'
export const operation = value => new Path(value).normalize().toString()
