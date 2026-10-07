# Update metrics and render the exposition text

One operation is given a description of a metrics registry and a sequence of
updates. It creates a new registry, registers the counters, gauges and
histograms the description lists (each with a help text, label names and, for
histograms, bucket upper bounds), applies every update in order and returns the
registry rendered as Prometheus text exposition. Each call starts from an empty
registry, so registration, updates and rendering are all inside the timed call.

An update is `[op, metricIndex, labelValues, amount]`: `inc` adds a positive
integer to a counter; `set`, `add` and `sub` set, raise or lower a gauge;
`observe` records a value in a histogram. The 8 fixtures have 3 to 30 metrics
and 30 to 2,000 updates, 1 to 6 label combinations per metric, 0 to 3 labels.
Label values include a double quote, a backslash and non-ASCII text. Amounts
are integers or multiples of 1/8, so every sum is exact in binary floating
point. The work is single-threaded and the same for every adapter, with each
library's default options and documented API. Libraries that need a facade plus
an exporter crate (`metrics`) use both.

## What counts as correct

The verifier reads the text with a strict reader of the text format (lines of
`# HELP`, `# TYPE` and `name{labels} value`, with escapes in label values) and
compares it with values computed from the fixture alone, never from a library:

- every registered metric has the right TYPE (counter, gauge or histogram) and
  the exact HELP text, and no other family is present;
- the set of samples is exactly the expected one, no more and no fewer: counter
  and gauge values, and for every histogram series each `_bucket` (cumulative,
  including `le="+Inf"`), `_count` and `_sum`;
- values match to a relative 1e-9.

Not compared: the order of families and samples, the order of labels, number
formatting (`1`, `1.0`, `1e+06`), blank lines, and whether a counter's family
is named with or without `_total` in its TYPE line. Python's `_created`
series are the clock time at which a series was made; they are ignored. The
scenario proves at load that damaged renderings (no TYPE lines, no buckets, no
sums, a wrong value, a missing sample, nothing) fail.

## Packages

- `metrics-exporter-prometheus` (with the `metrics` facade) renders histograms
  as summaries by default, which is not a histogram, so the default entry is
  recorded as not passing; the `-buckets` variant sets the buckets per
  histogram. Its counters take whole numbers, which is why counter amounts are
  integers.
- `@wok/prometheus` writes label values without escaping. A value containing
  `"` or `\` produces a line no parser accepts, so it is recorded as not passing.
  No option exists.
- `prom-client` (npm) is left out: `registry.metrics()` returns a Promise in
  every current version, and a synchronous task cannot wait for it.
- Go's `armon/go-metrics` and `rcrowley/go-metrics` keep samples in memory but
  do not render Prometheus text (rcrowley's histograms are reservoirs with
  quantiles, not buckets), `docker/go-metrics` is a thin wrapper over
  `client_golang`, and the others are not metrics registries of this kind.
- No standard library has a metrics registry that renders this text, so there
  are no builtin adapters.
