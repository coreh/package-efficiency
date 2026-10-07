import { configureSync, getLogger, jsonLinesFormatter } from '@logtape/logtape'

let out = ''
configureSync({
  sinks: { sink: (record) => { out += jsonLinesFormatter(record) } },
  loggers: [{ category: 'bench', lowestLevel: 'info', sinks: ['sink'] }, { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: [] }],
})
const logger = getLogger('bench')

export const operation = (doc) => {
  for (const r of doc.records) logger[r.level](r.message, r.fields)
  const result = out
  out = ''
  return result
}
