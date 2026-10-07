require 'prometheus/client'
require 'prometheus/client/formats/text'

def operation(spec)
  registry = Prometheus::Client::Registry.new
  counters = spec['counters'].map do |m|
    registry.counter(m['name'].to_sym, docstring: m['help'], labels: m['labels'].map(&:to_sym))
  end
  gauges = spec['gauges'].map do |m|
    registry.gauge(m['name'].to_sym, docstring: m['help'], labels: m['labels'].map(&:to_sym))
  end
  histograms = spec['histograms'].map do |m|
    registry.histogram(m['name'].to_sym, docstring: m['help'], labels: m['labels'].map(&:to_sym), buckets: m['buckets'])
  end
  spec['updates'].each do |op, i, values, amount|
    kind = op == 'inc' ? 'counters' : op == 'observe' ? 'histograms' : 'gauges'
    metric = (op == 'inc' ? counters : op == 'observe' ? histograms : gauges)[i]
    labels = {}
    spec[kind][i]['labels'].each_with_index { |l, k| labels[l.to_sym] = values[k] }
    case op
    when 'inc' then metric.increment(by: amount, labels: labels)
    when 'observe' then metric.observe(amount, labels: labels)
    when 'set' then metric.set(amount, labels: labels)
    when 'add' then metric.increment(by: amount, labels: labels)
    else metric.decrement(by: amount, labels: labels)
    end
  end
  Prometheus::Client::Formats::Text.marshal(registry)
end
