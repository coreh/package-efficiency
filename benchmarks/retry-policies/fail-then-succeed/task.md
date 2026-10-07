# Retry a function that fails a few times before it succeeds

One operation makes 40 calls, one after another. Each call has a value `v` and a
number of failures `f`, and is made through the package's retry policy with a cap
of `A` attempts (3, 5 or 8) and **no waiting between attempts**. There are three
fixtures, one per cap. The failure counts run from 0 to `A + 1`, so that every
case occurs: succeeds at once, succeeds after retries, succeeds on the very last
attempt, and fails with every attempt used.

The function is the same in every adapter, and does no work of its own:

1. count the call (`calls += 1`);
2. if `calls <= f`, fail with an error;
3. otherwise return `v * 2 + 1`.

The counter is created fresh for each call. After the retried call settles, the
adapter records `{ attempts: calls, value }`, where `value` is what the retry
returned, or `null` when it gave up (the package's final error is caught and
dropped). A correct output is a list of 40 such records in call order. With
`f < A` the call used `f + 1` attempts and returned `v * 2 + 1`; with `f >= A` it
used exactly `A` attempts and gave up. A policy that does not retry, retries
without a cap, stops one short or one over, or reports success when every attempt
failed, gives a different record. The attempts are counted by the function, not
by the package.

This is an asynchronous task on **one thread** (`load.threads` is 1, `concurrency`
is 1). Each operation is one awaited call. What is timed is creating the retrier or
options for each of the 40 calls, the loop that calls the function again, the
failure and its error object, and the runtime's awaiting. The function is trivial,
so a loop written by hand (the `builtin` entries) shows what the awaiting and the
exceptions cost without a package.

The retrier is created inside the measured call in every adapter, once per call.

## Waiting is set to zero

The task is about the policy of attempts, not about sleeping. The packages' default
waiting (p-retry waits one second before the first retry) is replaced by none,
through the option each package documents, the same way a limiter is given its
limit. The harness refuses a package whose zero delay is a real timer, and so
should this task: a timer wakes the process after at least a millisecond and the
CPU time would count none of it.

Which JavaScript packages could do it:

- `p-retry` (8.x) skips the timer when the delay is zero (`delayForRetry` returns at
  once), so it retries on microtasks. It is the one package compared here.
- `retry` always schedules the next attempt with `setTimeout`, even for 0 ms
  (`RetryOperation.retry`), and its attempt is callback based. Left out.
- `@humanwhocodes/retry` has no attempt cap (it retries until a time limit), only
  retries errors of a given kind, and wakes up with `setTimeout`. Left out; it
  does not do this job.

Not compared:

- `tokio-retry` and `backon` (crates) call `tokio::time::sleep(Duration::ZERO)`,
  which waits for the next tick of the runtime's timer. Both ran and were refused by
  the harness ("the operations wait instead of working": 1.3 ms of CPU in 462 ms).
  `backoff` has no attempt cap in its constant policy and its async retry also
  sleeps on a timer.
- The PyPI, RubyGems and Go packages (`tenacity`, `backoff`, `retry`, `retriable`,
  `cenkalti/backoff`, `eapache/go-resiliency`) do the job with zero waiting, but this
  harness only installs such packages for synchronous tasks, so they cannot be
  entered in an asynchronous one yet.
- Circuit breakers (`pybreaker`, `gobreaker`, `hystrix-go`) are a different job.
- `aiohttp-retry` retries HTTP requests of one client only.

The `builtin` entries are loops written by hand with the language's own exceptions:
JavaScript `try`/`catch` around an `await`, Python `try`/`except` around an `await`,
Ruby `begin`/`rescue` and Go checking an `error`.

See [shared methodology](../../README.md) for timing and reproduction.
