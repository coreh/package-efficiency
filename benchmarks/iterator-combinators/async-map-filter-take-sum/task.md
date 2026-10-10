# Lazy map, filter, take and sum over an async iterable

The asynchronous counterpart of [map-filter-take-sum](../map-filter-take-sum/task.md).
One operation takes `[data, limit]`: an array of integers and a count. The
values come from an async generator, and the chain must be built from the
package's async combinators. The unit of work is the same in every adapter:

1. set a counter `pulled` to 0 and create the source: an async generator that,
   for each value of `data` in order, adds one to `pulled` and then yields the
   value. It awaits nothing else (no timer, no turn of the event loop);
2. map every value `x` to `x * 3 + 1`;
3. keep the results that are not divisible by 5;
4. take the first `limit` of those;
5. reduce them to their sum, starting from 0, and await it;
6. return `{ sum, pulled }`, with `pulled` read after the sum has resolved.

The 49 fixtures are those of the synchronous task: arrays of 50 to 5,000
integers (a small, a medium and a large size class, built by a fixed
linear-congruential generator, no randomness) and limits that cut the stream
short, equal the exact number of survivors, exceed it, or are 0. Expected sums
are computed by a plain loop and compared exactly, so an adapter that returns
a constant, ignores `limit`, or skips the filter fails.

`pulled` checks laziness: when take has what it needs, the source must not be
read any further. Two counts are accepted, and nothing else:

- **tight**: take stops as soon as it has yielded `limit` values, so the
  source has yielded up to and including the `limit`-th survivor (none at all
  when `limit` is 0);
- **one look-ahead pull**: take asks its input for one more value before it
  notices that it is done, so the source has also yielded the values up to
  and including the next survivor (or up to its end).

The second is a common way of writing `take` (count after receiving the next
value instead of before asking for it). It reads a little further than
needed, but it still stops, and the extra work is the package's own and is in
its figure. An adapter that reads the whole source when take cut it short
(an eager step, or a take that drains its input) fails, and so does one that
reports a count it did not observe. At least half the fixtures stop before
the end of the source. When the limit reaches the number of survivors or
exceeds it, both counts are the length of `data`.

This is an asynchronous task on **one thread** (`load.threads` is 1,
`load.concurrency` is 1: one chain, one value in flight). Each operation is
one awaited call. What is timed is creating the source and the chain, and
pulling every value through it: in JavaScript a promise per step of every
iterator in the chain and the microtasks that settle them; in Python one
asyncio coroutine step per async generator. The callbacks are module level
functions defined once, and the source and the chain are created inside the
measured call in every adapter. Packages run with default settings as
installed.

Executors, as recorded with each result:

- JavaScript: the runtime's own event loop; nothing here waits on it, the
  whole operation runs in microtasks.
- Python: one `asyncio` event loop for the whole run.

## Packages

- `@core/iterutil` (JSR): `map`, `filter`, `take` and `reduce` from
  `@core/iterutil/async/*` (`reduce(take(filter(map(source, f), keep), limit), add, 0)`).
  Tight.
- `@hongminhee/aitertools` (JSR): `map(f, source)`, `filter(keep, …)`,
  `take(…, limit)` and `reduce(add, …, 0)`. One look-ahead pull (`take` counts
  after receiving a value, and with a limit of 0 it still asks for one).
- `@coven/iterables` (JSR): the curried `map`, `filter`, `take` and `reduce`
  of `@coven/iterables/async`. One look-ahead pull.
- `@doctor/iterstar` (JSR): `new AsyncIter(source).map(f).filter(keep).slice(0, limit).reduce(add, 0)`
  (the package's `take` is `slice(0, n)`, as in the synchronous task). Tight.
- `aioitertools` (PyPI): `aioitertools.builtins.map`,
  `aioitertools.itertools.filterfalse` with the predicate `x % 5 == 0` (the
  package has no async `filter`; `filterfalse` with the negated predicate is
  its lazy filter), `aioitertools.itertools.islice(…, limit)` and
  `aioitertools.builtins.sum`. Tight.

## Left out

- Built-in entries: there are none. JavaScript's async iterator helpers
  (`AsyncIterator.prototype.map` and the rest) are a proposal that no runtime
  ships yet (Node 24, Bun and Deno have only the synchronous helpers), and
  neither Python's standard library nor Ruby's has lazy combinators over an
  async iterable. Writing the chain by hand would not be a library's figure.
- `@lambdalisue/itertools`, an entry of the synchronous task: it has no async
  combinators.
