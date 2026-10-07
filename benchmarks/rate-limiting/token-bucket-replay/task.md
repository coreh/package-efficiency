# Replaying requests through a token bucket

One operation builds a new keyed rate limiter and replays a timeline of 240
requests through it. A fixture gives a `rate` (tokens per second), a `burst`
(bucket size), and two parallel lists of the same length: `keys` (strings) and
`times` (milliseconds since the start of the timeline, never decreasing). For
each request, in order, the adapter hands the limiter the request's time and
asks whether one token may be taken for its key. The result is the list of
decisions, one boolean per request, `true` for allowed.

Every key has its own bucket. A bucket is full the first time its key is seen,
holds at most `burst` tokens, and gains one token every `1000 / rate` ms. A
request that finds a whole token takes it and is allowed; otherwise it is
denied and takes nothing.

Time is given to each package explicitly (governor's fake clock, `AllowN(now)`
of `golang.org/x/time/rate`, juju/ratelimit's clock interface), never read from
the machine's clock, so the result is deterministic. Where a package has no
keyed store of its own, the adapter keeps one limiter per key in a map, which is
how its documentation has callers do it. The limiter is created inside the
timed call, so no state carries between calls.

The 32 fixtures are four rates (1, 2, 4 and 8 per second) with bursts of 1, 2, 3
and 5, over timelines that are bursty, steady, sparse (long idle gaps,
where a bucket must not exceed its size) or dominated by one hot key. Request
times are whole refill intervals, so no package depends on how it rounds a
fraction of a token, and the packages agree exactly. A reference implementation
in `scenario.mjs` fixes the decisions of every request, and the check is exact:
a limiter that never denies, never refills, shares one bucket across keys, keeps
tokens beyond the burst, or counts a fixed window instead of a bucket gives
different decisions and fails.

Scope: single-threaded, in-memory, per-key token-bucket (or equivalent GCRA)
limiting at explicit times. Packages that only read the real clock or run on
real timers (express-rate-limit, the `ratelimit` and `limits` packages), and
fixed-window or sliding-window counters, are out of scope. Retry policies,
concurrency limiters and gateways are not included.
