# Latency percentiles

One operation takes a stream of latency samples (an array of 20,000 positive
integers, in microseconds) and returns `[p50, p90, p99, p99.9]` as four numbers.
Each call builds a new, empty histogram or sketch, records every sample into it,
and queries the four percentiles. Nothing is kept between calls.

The 24 fixtures are deterministic and vary in shape: log-normal latencies with
different spreads, bimodal fast/slow mixes, uniform ranges, heavy-tailed
(Pareto-like) samples, a constant stream, and small and large magnitudes.

A correct output has four finite numbers in non-decreasing order. Sketches are
approximate and define percentile ranks slightly differently, so each value is
accepted if it lies between the exact sample two ranks below the target rank
(minus 2%) and the exact sample two ranks above it (plus 2%). This admits the
1% relative error the sketches are configured for, and rejects a wrong
percentile, a swapped order or a mean/max in place of a quantile.

Every entry is set for about 1% accuracy:

- `sketches-ddsketch` (Rust) by its default configuration;
- HDR Histogram, which has no default, with 2 significant figures (Rust
  `hdrhistogram`, Go `HdrHistogram/hdrhistogram-go`);
- Go `influxdata/tdigest` with compression 5000 and `VividCortex/gohistogram`
  with 5000 bins, because smaller settings (the t-digest default of 1000; 160
  or 1000 bins) miss the bound on some fixtures;
- Go `beorn7/perks`, a biased-quantile stream, with a rank error of 0.0001 for
  each of the four targets.

Each adapter returns the four values as plain numbers, mapped to the common
shape inside the call.
