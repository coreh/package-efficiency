import { BaseHandler, getLogger, jsonFormatter, setup } from '@std/log'

let out = ''
class Sink extends BaseHandler {
  log(msg) { out += msg + '\n' }
}
setup({
  handlers: { sink: new Sink('INFO', { formatter: jsonFormatter }) },
  loggers: { default: { level: 'INFO', handlers: ['sink'] } },
})
const logger = getLogger()
const methods = { info: logger.info.bind(logger), warn: logger.warn.bind(logger), error: logger.error.bind(logger) }

export const operation = (doc) => {
  for (const r of doc.records) methods[r.level](r.message, r.fields)
  const result = out
  out = ''
  return result
}
