# Open a circuit breaker after consecutive failures

One operation creates a circuit breaker and sends 500 calls through it, one
after another. The input says, for each call, whether it succeeds or fails.
The breaker is configured to open after **5 consecutive failures** and to stay
open for 100 ms. Once it is open it must reject every later call without
running it. There are six fixtures.

The function is the same in every adapter, and does no work of its own:

1. note that it ran (`ran = true`);
2. if the call is one that fails, fail with an error (Go: return an `error`;
   Python: raise an exception);
3. otherwise return.

`ran` is reset before each call. After the breaker returns, the adapter
records one outcome:

- `"ran-ok"`: the function ran and the breaker returned without an error;
- `"ran-failed"`: the function ran and the breaker returned an error (or
  raised). This includes the fifth failure, on which some packages replace
  the function's error with their own "breaker is open" error;
- `"rejected"`: the function did not run.

So whether a call ran is told by the function, not by the package's error
type. A correct output is the list of 500 outcomes in call order, compared
exactly with the scenario's own breaker: every call succeeds and runs until
the first failure, the first five failures in a row run, and every call after
the fifth is rejected, whether it would have failed or succeeded.

The breaker is created inside the measured call, once per operation, in every
adapter. What is timed is creating it, its bookkeeping for each call (the
state check, counting failures, the error it returns when it is open) and the
loop of 500 calls.

## The fixtures

The packages count failures that are not in a row differently.
`eapache/go-resiliency` counts every error until the open time passes without
one, and a success does not reset the count; `sony/gobreaker` (with a
`ReadyToTrip` on `ConsecutiveFailures`) and `pybreaker` reset it on every
success. A breaker that has seen fail, succeed, fail, fail, fail, fail would
be open in the first and closed in the others, and both are what the package
documents. So **no fixture has a failure before its first run of five**:
every call before that run succeeds. Calls after the breaker has opened fail
or succeed at random (seeded), since none of them may run. This restriction is
what makes the three packages do the same job; the task does not compare how
they count scattered failures.

| Fixture | Calls that run and succeed | Failures that run | Rejected |
| --- | --- | --- | --- |
| Opens on the fifth call | 0 | 5 | 495 |
| Five failures from call 120 | 120 | 5 | 375 |
| Nine failures from call 300 (four of them rejected) | 300 | 5 | 195 |
| The fifth failure is the last call | 495 | 5 | 0 |
| Four failures at the end: stays closed | 496 | 4 | 0 |
| Every call succeeds | 500 | 0 | 0 |

The last two catch a breaker that opens one failure early, the fourth one
that opens one late, and the third one that lets a failure through after it
has opened.

The scenario checks itself when it loads: its own outcomes pass, and these
fail: every call run (no breaker), a breaker that opens after 4 or after 6
failures, one that lets a call through after every ten rejections (a
half-open breaker), rejections reported as failures, one outcome short, and
another fixture's outcomes.

## The open time

The breaker would half-open after its open time. 100 ms is far longer than
an operation of 500 trivial calls takes on any runtime, so no breaker
half-opens during one, and the half-open state is not part of the task.

The time is not longer, such as an hour, because of one package.
`go-resiliency` starts a goroutine each time a breaker opens, which sleeps for
the open time and then moves the breaker to half-open (`openBreaker` runs
`go b.timer()`). In this task a new breaker opens in four operations out of
six, and those goroutines stay alive for the open time after the operation
has returned. With an hour they would pile up for the whole run, hundreds of
thousands of them; with 100 ms at most the last 100 ms of openings are alive.
Starting the goroutine, its wake-up and what it holds are that package's
work and are in its figures, CPU and memory. `gobreaker` and `pybreaker`
start nothing: they compare the time when the next call arrives, so the open
time does not change what they do.

## Packages

- `pybreaker` (PyPI): `CircuitBreaker(fail_max=threshold,
  reset_timeout=openMs / 1000)`, and `breaker.call(fn)` for each call. When
  the fifth failure opens it, `call` raises `CircuitBreakerError` instead of
  the function's exception (the function did run: `"ran-failed"`); an open
  breaker raises `CircuitBreakerError` without calling. Its state is kept in
  its default in-memory storage, behind a lock.
- `github.com/sony/gobreaker` (Go): `NewCircuitBreaker` with `Settings` whose
  `ReadyToTrip` returns `counts.ConsecutiveFailures >= threshold`, `Timeout`
  the open time and `Interval` 0 (counts are never cleared while closed), and
  `Execute(fn)` for each call; an open breaker returns `ErrOpenState`.
- `github.com/eapache/go-resiliency` (Go): `breaker.New(threshold, 1,
  openMs)` and `Run(fn)` for each call; an open breaker returns
  `ErrBreakerOpen`. Its successful calls in the closed state return without
  taking the lock.

The standard libraries of JavaScript, Python, Ruby and Go have no circuit
breaker, so there are no built-in entries.

## Left out

- `afex/hystrix-go`: it opens on an error percentage over a rolling window,
  with a minimum request volume, and its counts are updated by a goroutine
  that reads events from a channel. When a call is rejected depends on when
  that goroutine has run, so the outcome list is not deterministic.
- `opossum` and `cockatiel` (npm): every call through their breakers
  (`fire`, `execute`) returns a promise, so they are not entries of a
  synchronous task.

See [shared methodology](../../README.md) for timing and reproduction.
