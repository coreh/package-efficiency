import { Counter, Gauge, Histogram, Registry } from '@wok/prometheus'

export const operation = (spec) => {
  const registry = new Registry()
  const counters = spec.counters.map((m) => Counter.with({ name: m.name, help: m.help, labels: m.labels, registry: [registry] }))
  const gauges = spec.gauges.map((m) => Gauge.with({ name: m.name, help: m.help, labels: m.labels, registry: [registry] }))
  const histograms = spec.histograms.map((m) => Histogram.with({ name: m.name, help: m.help, labels: m.labels, buckets: m.buckets, registry: [registry] }))
  for (const [op, i, values, amount] of spec.updates) {
    const metric = op === 'inc' ? counters[i] : op === 'observe' ? histograms[i] : gauges[i]
    const spec_ = spec[op === 'inc' ? 'counters' : op === 'observe' ? 'histograms' : 'gauges'][i]
    const labels = {}
    spec_.labels.forEach((l, k) => { labels[l] = values[k] })
    const child = spec_.labels.length ? metric.labels(labels) : metric
    if (op === 'inc') child.inc(amount)
    else if (op === 'observe') child.observe(amount)
    else if (op === 'set') child.set(amount)
    else if (op === 'add') child.inc(amount)
    else child.dec(amount)
  }
  return registry.metrics()
}
