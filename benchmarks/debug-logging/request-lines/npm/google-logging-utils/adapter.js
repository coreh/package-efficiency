import { log } from 'google-logging-utils'
import { format } from 'node:util'
process.env.GOOGLE_SDK_NODE_LOGGING = 'app:web:*,app:db:*,app:cache:*,app:auth:*,app:api:*'
let line = ''
// The library's node backend writes with console.error; this capture stands in for stderr.
console.error = (...args) => { line = format(...args) + '\n' }
// Namespace i of the task is app:<area>:<n> with i = area index * 10 + n; each
// fixture carries that index as `id`.
const areas = ['web', 'db', 'cache', 'queue', 'auth', 'search', 'mail', 'cron', 'api', 'fs']
const namespaces = areas.flatMap(area => Array.from({ length: 10 }, (_, n) => `app:${area}:${n}`))
const loggers = namespaces.map(ns => log(ns))
export const operation = ({ id, method, path, ms }) => {
  const logger = loggers[id]
  line = ''
  logger.info('%s %s took %dms', method, path, ms)
  return line
}
