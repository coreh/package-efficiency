import { JsonLog } from '@danielfroz/slog'

let out = ''
const log = new JsonLog({ level: 'INFO', func: (line) => { out += line + '\n' } })
const methods = { info: log.info.bind(log), warn: log.warn.bind(log), error: log.error.bind(log) }

export const operation = (doc) => {
  for (const r of doc.records) methods[r.level]({ msg: r.message, ...r.fields })
  const result = out
  out = ''
  return result
}
