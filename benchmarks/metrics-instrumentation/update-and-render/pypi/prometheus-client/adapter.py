from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, generate_latest


def operation(spec):
    registry = CollectorRegistry()
    counters = [Counter(m['name'], m['help'], m['labels'], registry=registry) for m in spec['counters']]
    gauges = [Gauge(m['name'], m['help'], m['labels'], registry=registry) for m in spec['gauges']]
    histograms = [Histogram(m['name'], m['help'], m['labels'], buckets=m['buckets'], registry=registry) for m in spec['histograms']]
    for op, i, values, amount in spec['updates']:
        if op == 'inc':
            metric = counters[i]
        elif op == 'observe':
            metric = histograms[i]
        else:
            metric = gauges[i]
        child = metric.labels(*values) if values else metric
        if op == 'inc':
            child.inc(amount)
        elif op == 'observe':
            child.observe(amount)
        elif op == 'set':
            child.set(amount)
        elif op == 'add':
            child.inc(amount)
        else:
            child.dec(amount)
    return generate_latest(registry).decode('utf-8')
