import createDebug from 'debug'
import { format } from 'node:util'
createDebug.enable('app:web:*,app:db:*,app:cache:*,app:auth:*,app:api:*')
// The line format is set here, so DEBUG_COLORS, DEBUG_HIDE_DATE and whether
// stderr is a terminal cannot change it: no colours, ISO date prefix (what
// debug does by default when stderr is not a terminal).
createDebug.inspectOpts.colors = false
createDebug.inspectOpts.hideDate = false
let line = ''
const sink = (...args) => { line = format(...args) + '\n' }
// Namespace i of the task is app:<area>:<n> with i = area index * 10 + n; each
// fixture carries that index as `id`.
const areas = ['web', 'db', 'cache', 'queue', 'auth', 'search', 'mail', 'cron', 'api', 'fs']
const namespaces = areas.flatMap(area => Array.from({ length: 10 }, (_, n) => `app:${area}:${n}`))
const loggers = namespaces.map(ns => { const log = createDebug(ns); log.log = sink; return log })
export const operation = ({ id, method, path, ms }) => {
  const log = loggers[id]
  line = ''
  log('%s %s took %dms', method, path, ms)
  return line
}
