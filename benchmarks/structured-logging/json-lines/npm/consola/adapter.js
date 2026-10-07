import { createConsola } from 'consola'

let out = ''
const logger = createConsola({
  throttle: 0,
  reporters: [{ log: (entry) => { out += JSON.stringify({ level: entry.type, time: entry.date.getTime(), message: entry.args[0], ...entry.args[1] }) + '\n' } }],
})
const methods = { info: logger.info, warn: logger.warn, error: logger.error }

export const operation = (doc) => {
  for (const r of doc.records) methods[r.level](r.message, r.fields)
  const result = out
  out = ''
  return result
}
