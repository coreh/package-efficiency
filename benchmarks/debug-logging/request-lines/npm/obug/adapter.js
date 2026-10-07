import { createDebug, enable } from 'obug'
import { format } from 'node:util'
enable('app:web:*,app:db:*,app:cache:*,app:auth:*,app:api:*')
let line = ''
const log = (...args) => { line = format(...args) + '\n' }
// Namespace i of the task is app:<area>:<n> with i = area index * 10 + n; each
// fixture carries that index as `id`.
const areas = ['web', 'db', 'cache', 'queue', 'auth', 'search', 'mail', 'cron', 'api', 'fs']
const namespaces = areas.flatMap(area => Array.from({ length: 10 }, (_, n) => `app:${area}:${n}`))
// The line format is set here, so DEBUG_COLORS, DEBUG_HIDE_DATE and whether
// stderr is a terminal cannot change it: no colours, ISO date prefix (what
// obug does by default when stderr is not a terminal). obug reads hideDate
// from the one inspectOpts object every logger shares, so it is set through
// the first logger.
const loggers = namespaces.map(ns => createDebug(ns, { log, useColors: false }))
loggers[0].inspectOpts.hideDate = false
export const operation = ({ id, method, path, ms }) => {
  const logger = loggers[id]
  line = ''
  logger('%s %s took %dms', method, path, ms)
  return line
}
