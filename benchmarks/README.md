# Benchmark tasks

Run a task on Node, Bun and Deno (three fresh processes per adapter):

```sh
npm_config_cache="$PWD/.cache/npm" npm run measure -- deep-equality/nested-json
npm_config_cache="$PWD/.cache/npm" npm run measure -- stable-json-stringify/nested-records
npm_config_cache="$PWD/.cache/npm" npm run measure -- html-escaping/text-attributes
npm run build
```

Use `--force` to replace cached results, `--runtimes=node` to narrow runtimes,
`--only=dequal` to select an adapter, or `--reps=1` for a smoke run. Full runs
should use the default three repetitions. Run tasks sequentially on an idle
machine. On macOS the supervisor needs permission to run `ps` and
`/usr/bin/time -l` against its child processes.

## Synchronous operations

Adapters export `operation(input)`. Scenarios export `cases`, `verify(operation)`
and `consume(result)`. Each operation must complete synchronously. Fixtures are
created once and reused. Correctness checks run before warm-up; their work is
excluded from timing. The timed loop invokes the adapter and folds every output
into a checksum. This includes a shared loop, indexing and consumption overhead.

Every adapter gets the same time, whatever one call costs, so the length of
a run is predictable. A few probe calls give the rough cost of a call. The
warm-up is then the task's `warmup` calls (10,000) or two seconds, whichever
comes first, followed by a full three-round unmeasured rehearsal and three
measured rounds. A round runs batches until `minRoundMs` (250 ms) has elapsed;
a batch is about a tenth of that, never more than `operationsPerRound`
calls, and always a whole number of passes over the fixtures, so every round
of every adapter covers the same mix of inputs. Counts are recorded per round, so costs use
the actual count rather than assuming every adapter did equal work. CPU is child
user plus system CPU from `process.cpuUsage()`. GC can occur naturally inside a
batch; forced settled GC runs outside timing. Heap includes external memory.
Peak RSS covers the whole process, including fixture construction and validation;
it is not solely package allocation. No individual-call latency is measured.

A result may be a string, a boolean or a structured value (a parsed document, a
list, a library's own type), in every language. What a library returns is what
the adapter returns: an adapter never serializes, hashes or walks a result just
to hand it to the harness, because that work would be timed. The measured loop
reads only something cheap from each result, such as its length:

- JavaScript: the scenario's `consume(result)`.
- Python, Ruby, Go: the runner counts the length of a string, list or map, and
  one for anything else. The verifier needs JSON, so a Python or Ruby adapter
  whose result is not plain JSON data also defines `describe(result)`; a Go
  result is marshalled with `encoding/json`. Both happen once per fixture,
  before any measured work.
- Rust: `operation::run_value(operation, consume, describe)`, with the same
  split: `consume` is measured, `describe` (result to `serde_json::Value`) is
  not.
  A zero-copy parser, whose result borrows from the input, uses
  `run_value_with_input`: the operation keeps only counts or offsets, and
  `describe` is also given the input so it can parse again for the verifier.

Reading the input is not timed either, unless reading it is the task. A
fixture's input is JSON; where the library takes something else (bytes from
hex or base64, a typed record, a compiled pattern), the adapter defines
`prepare(input)`, which runs once per fixture before any measured work, and
the operation is given what it returned:

- JavaScript: an exported `prepare`. The scenario's verifier still calls the
  operation with the raw input; the runner prepares it first.
- Python, Ruby, Go: a `prepare` function next to `operation`.
- Rust: `operation::run_prepared(prepare, operation, consume, describe)`.

A prepared input is shared by every call, so the operation must not change it.

Where packages return different shapes for the same answer, each adapter maps
its result to the task's common shape inside the measured call, in every
language alike, and the task says so.

The site reports the median of round costs, then the median across fresh
processes. These are repeated, cache-hot microbenchmarks of deliberately narrow
contracts; they do not rank a library's entire API. Tiny differences and memory
near the 4 MiB grading floor should not be over-interpreted. CPU grading uses
four decimal places for microsecond operation costs to avoid zero anchors.

New adapter versions use the existing seven-day release-age filter, disabled
install scripts, and shared `versions.json`. Raw results include runtime and
machine versions. Adapter metadata records authorship and unreviewed status.

## Adapters for PyPI, RubyGems and Go modules

A synchronous task (`"kind": "sync-operation"`) takes third-party packages in
Python, Ruby and Go beside the standard-library adapters under `builtin/`.
You write files in the task's folder only. The scripts choose the version,
install it and record what they installed.

### What you write

| Registry | Folder | Files you write |
| --- | --- | --- |
| PyPI | `<task>/pypi/<name>/` | `adapter.py`, `adapter.json` |
| RubyGems | `<task>/rubygems/<name>/` | `adapter.rb`, `adapter.json` |
| Go modules | `<task>/gomod/<name>/` | `adapter.go`, `adapter.json` |

`<name>` is the package's name in its registry:

- PyPI: the project name in lower case with `-` for `_` and `.`
  (`orjson`, `typing-extensions`, `pyyaml`).
- RubyGems: the gem's name exactly (`oj`, `multi_json`).
- Go: made from the module path. Drop a major-version suffix (`/v5`, `.v3`),
  drop `github.com/`, write `-` for `/`, lower case:
  `github.com/goccy/go-json` is `goccy-go-json`, `github.com/go-chi/chi/v5`
  is `go-chi-chi`, `golang.org/x/text` is `golang.org-x-text`,
  `gopkg.in/yaml.v3` is `gopkg.in-yaml`. The full module path goes in
  `adapter.json` as `"module"`; the site links the module by it.

A wrong name is refused with the right one in the message.

The adapter source follows the same contract as a `builtin/` adapter of its
language (see "Synchronous operations" above): `operation(input)`, and where
needed `prepare(input)` and `describe(result)`. Read the task's `task.md`,
`scenario.mjs` and its `builtin/` adapter in your language first, and return
the same shape.

PyPI, `pypi/orjson/`:

```python
import orjson
def operation(value):
    return orjson.loads(value)
```

```json
{
  "author": { "kind": "agent", "agent": "claude-code", "model": "<your model>", "date": "<today>" },
  "review": "unreviewed",
  "language": "python",
  "runtimes": ["cpython", "pypy"],
  "notes": "One or two sentences: which function is called, with which options, and what is returned."
}
```

RubyGems, `rubygems/oj/`:

```ruby
require 'oj'
def operation(value)
  Oj.load(value, mode: :strict)
end
```

```json
{
  "author": { "kind": "agent", "agent": "claude-code", "model": "<your model>", "date": "<today>" },
  "review": "unreviewed",
  "language": "ruby",
  "runtimes": ["ruby", "ruby-yjit"],
  "notes": "…"
}
```

Go, `gomod/goccy-go-json/`:

```go
package main
import json "github.com/goccy/go-json"
func operation(value any) any { var out any; if err:=json.Unmarshal([]byte(value.(string)),&out);err!=nil {panic(err)}; return out }
```

```json
{
  "author": { "kind": "agent", "agent": "claude-code", "model": "<your model>", "date": "<today>" },
  "review": "unreviewed",
  "title": "goccy/go-json",
  "language": "go",
  "runtimes": ["go"],
  "module": "github.com/goccy/go-json",
  "notes": "…"
}
```

Optional fields of `adapter.json`:

- `"title"`: the name shown, when the folder name reads badly (Go).
- `"package"`: the package's name, when the folder is a second adapter for the
  same package (`pypi/orjson-option-x/` with `"package": "orjson"`).
- `"dependencies"`: other packages of the same registry that your adapter
  itself imports (PyPI and RubyGems). Not the package's own dependencies:
  those are found for you. A Go adapter just imports what it needs.

Always list every runtime of the language (`cpython` and `pypy`; `ruby` and
`ruby-yjit`). Where a package cannot run on one, the scripts say so and
record it; you do not remove the runtime.

Do not write or edit `lock.json`, `go.mod`, `go.sum` or `versions.json`, and
do not run `pip`, `gem` or `go get` yourself. Do not edit anything outside
your task's folder.

### What the scripts do

The first time an adapter is run (`--check` counts):

1. The version is chosen: the one in `versions.json` if another task already
   uses the package, otherwise the newest release published at least seven
   days ago that runs on the pinned runtime. The same for every dependency.
2. The exact files are written beside the adapter: `lock.json` (PyPI,
   RubyGems: each file with its SHA-256 and publication date, per kind of
   machine) or `go.mod` and `go.sum` (Go). The version is added to
   `versions.json`. Keep these files: they are part of the adapter, and a
   rerun installs exactly what they name. Delete them only to resolve again.
3. The package is installed under `.cache/native-packages/` in a folder named
   by a hash of its files (Go: built under `.cache/work/<task>/gomod/`), so
   runs of different tasks at the same time do not disturb each other.

The adapter then runs under the harness's own runner for its language, with
the same warm baseline as the `builtin/` adapters: the figures mean the same.
The version, the dependencies and the install size are recorded with each
result (Python: the files of the package and what it requires; Ruby: the
gem folders; Go: what the module adds to the binary over the baseline
binary, as for Rust).

PyPy is given pure-Python wheels only. A package with none (orjson) prints
`not available: …` for `pypy`; that is recorded as such and is not a failure.
A package with both kinds of wheel (simplejson) runs its compiled code on
CPython and its Python code on PyPy.

### Install rules

These are the project's safety rules. Never work around them; if a package
cannot be installed under them, leave it out and say so.

- Every release installed, the package's and each dependency's, was published
  at least seven days ago. "Latest" means the latest within that window. The
  registry is asked before anything is downloaded.
- PyPI: wheels only. A release with only a source distribution is not
  installed, because building it runs the package's code. A wheel with
  compiled code (a C or Rust extension, as orjson has) is allowed: it is a
  binary the authors built and published for this platform, pinned by its
  SHA-256, and installing it unpacks files and runs nothing. (The shared web
  applications allow pure-Python wheels only because CPython and PyPy import
  from one folder there; here each runtime has its own files.)
- RubyGems: a precompiled gem for the platform is used when there is one. A
  gem with a native extension and no precompiled build is compiled by
  `gem install`, which runs its `extconf.rb`, after its age and SHA-256 are
  checked. This is the one case where a package's code runs at install, as
  for the Rails application. `lock.json` marks each such gem
  (`"compiles": true`) and the site says so in the entry's details.
- Go: `go build -mod=readonly` of the pinned, age-checked modules, through a
  proxy of the scripts' own that refuses the source of any version less than
  seven days old. No `go generate`.
- No install scripts, no sudo, nothing installed outside `.cache/`.

### Check your work

```sh
node scripts/measure.mjs <category>/<task> --check --only=<name>
```

`<name>` is your folder name. Each runtime must print `works` (or, for PyPy,
`not available: …`) and the command must exit with 0. `--check` runs the
task's correctness checks and one short round; it is safe to run while other
tasks are being checked. What the other lines mean:

| Line | What to do |
| --- | --- |
| `could not install: name the folder …` | Rename the folder as the message says. |
| `could not install: no eligible release …` | Nothing at least seven days old has a wheel (or gem) for the pinned runtime. Leave the package out. |
| `could not install: … requires go >= …` | A dependency needs a newer Go than the pinned one. Leave the package out. |
| `verify-failed: …` | Your adapter's results differ from the task's. Fix the adapter, not the task. |
| `crashed` or `expected phase …` | Run the runner by hand to see the error (below). |

To see an error in full, start the runner as the script does, with the
interpreter that `runtimes.json` names (`bin`), from the repository's root.
`<hash>` is the folder the package was installed in: the newest one under
`.cache/native-packages/pypi/` or `.cache/native-packages/rubygems/`.

```sh
# Python
PYTHONPATH=.cache/native-packages/pypi/<hash> /opt/homebrew/bin/python3 -B harness/python/runner.py benchmarks/<category>/<task>/pypi/<name>/adapter.py .cache/work/<category>/<task>/fixtures.json </dev/null
# Ruby
GEM_HOME=$PWD/.cache/native-packages/rubygems/<hash> /opt/homebrew/opt/ruby/bin/ruby harness/ruby/runner.rb benchmarks/<category>/<task>/rubygems/<name>/adapter.rb .cache/work/<category>/<task>/fixtures.json </dev/null
# Go: the build error is printed by --check itself.
```

It prints the adapter's results for the fixtures (the `verification` line),
or the error.

Then the type check of the adapter, which records nothing with `--verify`:

```sh
node scripts/measure-native-checks.mjs --verify --only=<category>/<task>/<registry>/<name>
```

It must end with `0 rejected`, with one exception: a gem that ships no Sorbet
signatures is rejected with `Unable to resolve constant`. Leave that as it
is and report it; the adapter is then recorded as not type-checked.

Do not run `scripts/measure.mjs` without `--check`: measuring is done later,
in one go, on an idle machine. Until the type checks are measured then
(`node scripts/measure-native-checks.mjs --missing`), `npm test` reports a
new adapter of an already measured task as missing a check; that is expected.

## Asynchronous operations

A task of kind `"async-operation"` is for work that cannot be one synchronous
call: the result exists only after promises, tasks, goroutines or threads have
run. Limiters, queues, channels, locks, pools and streams are of this kind.
Everything under "Synchronous operations" above still holds (fixtures made
once, `prepare`, `describe`, verification before warm-up, the same warm-up,
rehearsal and rounds, the same figures and units); this section says only what
differs. Two finished tasks to copy from:
`async-concurrency/limited-jobs` (one thread, an awaited call, JavaScript,
Python, Go and Rust) and `message-channels/bounded-mpsc-threads` (five threads,
a blocking call, Rust, Go, Python and Ruby).

Use it only where it is needed. If every package in the task does the job in
one synchronous call, write a `"sync-operation"` task.

### What an operation is, and what is timed

One operation is one call that is **finished when it returns its result**:

- JavaScript and Python coroutines: the runner awaits the call. The whole run
  is inside one event loop, as in any program in those languages.
- Rust futures: the runner awaits the call inside one `block_on` of the
  adapter's executor (see "Executors" below).
- Go, Ruby, Rust with threads, Python with threads: the call blocks. It starts
  its goroutines or threads and joins them before it returns.

Operations run one after another, never overlapped. A round is timed from
before its first call to after its last result, plus one more turn of the
event loop or executor, so that work an operation left scheduled is charged
to the round. CPU time is that of the whole process, every thread included
(`process.cpuUsage()`, `getrusage`, `time.process_time()`,
`CLOCK_PROCESS_CPUTIME_ID`); threads are not multiplied in. Memory is read as
for synchronous tasks, above the warm baseline of the same runner.

### Rules that are specific to this kind

1. **The result proves the work is done.** It must be computed from every unit
   of work (every job's value, every message received), and the verifier must
   check it strictly. An operation that only schedules work and returns would
   then return a wrong result. Never return a count you already knew.
2. **No real delays.** No `sleep`, no timer with a delay, no waiting on a
   clock. A delay of zero is not free either: `setTimeout(fn, 0)` waits a
   millisecond on Node. CPU time is what is graded, so waiting would cost
   nothing and rank first. The harness refuses the plain cases: a run whose
   measured round used less than 8% of its wall-clock time as CPU fails with
   "the operations wait instead of working" (a millisecond timer per
   operation uses about 2%; honest work on Node's event loop or between
   blocked threads can be as low as 20%, see `harness/async-operation.mjs`).
   That check is a backstop, not permission for short sleeps. If a package cannot do the job without a real timer, leave it out
   and say so in `task.md`. Do not replace its timer with a fake one unless the
   package itself offers that as an option (a `sleep` argument, a paused
   clock), and then say so in the adapter's `notes`.
3. **One yield is the same thing everywhere.** Where a unit of work has to
   give way once, use: JavaScript `await new Promise((r) => setImmediate(r))`
   with `setImmediate` imported from `node:timers` (a turn of the event loop;
   `await null` is only a microtask, and a job that short ends before most
   limiters have started the next one); Python `await asyncio.sleep(0)`; Go
   `runtime.Gosched()`; Rust `tokio::task::yield_now().await` on tokio and
   `bench_harness::async_operation::yield_now().await` on anything else.
4. **Threads and concurrency are part of the task.** `task.json` `load` has
   two more fields, both required: `threads`, how many threads run the task's
   code at once, and `concurrency`, the largest number of units in flight
   (jobs, producers, callers). Every fixture and every adapter of a task uses
   the same thread count. They are stored in each result with the adapter's
   executor. What `threads` means:
   - `1`: JavaScript on its main thread; Python on one asyncio loop; Rust on
     a single-thread executor; Go with `GOMAXPROCS=1`, which the harness
     sets. Work interleaves, it never runs in parallel.
   - `N` above 1: exactly N threads run the task's code (count the calling
     thread if it does part of the work). Rust `std::thread` or a
     multi-thread executor with `worker_threads(N)`; Go with `GOMAXPROCS=N`,
     set by the harness; Python `threading` and Ruby `Thread`, which run one
     at a time under the interpreter lock (say so in the adapter's `notes`).
     JavaScript has no entry in such a task unless the packages themselves
     are about worker threads.
   The harness also sets `BENCH_THREADS` to the number.
5. **Executors.** The harness has none. A Rust adapter brings the runtime its
   crate is built for: a tokio crate runs on tokio (`new_current_thread()`
   when `threads` is 1, `new_multi_thread().worker_threads(N)` otherwise), a
   crate with its own executor on that one. A crate that works on any executor
   uses the one `task.md` names for the task, the same for all such crates in
   it (`futures::executor::block_on` unless there is a reason). Every adapter,
   in every language, says what it runs on in `adapter.json` `"executor"`
   (for example `"tokio current-thread"`, `"event loop"`,
   `"asyncio event loop"`, `"goroutines, GOMAXPROCS=5"`), and it is written
   into each result.
6. **The same unit of work in every adapter.** Write the job, the producer or
   the caller out step by step in `task.md`, and implement exactly those
   steps in each language. It should do no work of its own, so that the figure
   is the package's and the scheduler's.
7. **Where things are created.** The limiter, channel, pool or lock is created
   inside the measured call in every adapter, and so are the tasks, goroutines
   or threads that use it. Their start-up is part of the figure; say so in
   `task.md`. Size the fixtures so that it is a small part (thousands of
   messages per started thread, not tens).
8. **State the scheduler's share.** A task with trivial jobs measures the
   runtime's scheduling as much as the package. Say in `task.json` `notes`
   what the figure consists of.

### Files

```
benchmarks/<category>/category.json            once per category
benchmarks/<category>/<task>/task.json
benchmarks/<category>/<task>/task.md
benchmarks/<category>/<task>/scenario.mjs
benchmarks/<category>/<task>/npm/<package>/adapter.json, adapter.js
benchmarks/<category>/<task>/jsr/@scope/name/adapter.json, adapter.js
benchmarks/<category>/<task>/cargo/<crate>/adapter.json, Cargo.toml, src/main.rs
benchmarks/<category>/<task>/builtin/<name>/adapter.json, adapter.py | adapter.rb | adapter.go | adapter.js
```

`task.json` is that of a synchronous task with another `kind` and the two
`load` fields:

```json
"kind": "async-operation",
"load": { "warmup": 2000, "rounds": 3, "operationsPerRound": 20000, "minRoundMs": 250, "threads": 1, "concurrency": 32 },
```

Lower `warmup` and `operationsPerRound` when one operation is slow (the
warm-up also ends after two seconds). Copy `metrics` from an existing task.

`scenario.mjs` exports `cases` (`{ input, expected }`, inputs plain JSON),
`verifyResults(outputs)` (strict, used for every language), `consume(result)`
and an **async** `verify`:

```js
export const verify = async (operation) => {
  const outputs = []
  for (const { input } of cases) outputs.push(await operation(input))
  verifyResults(outputs)
}
```

Every `adapter.json` has `author`, `"review": "unreviewed"`, `"executor"` and
`notes`; a `builtin` one also has `title`, `language` and `runtimes`, as in
the two example tasks.

### Files that operations write

An asynchronous task may use fixture files exactly as "Tasks on the file
system" below describes: the scenario exports `files = { tree, reset }`, and
case inputs carry absolute paths under `BENCH_FILES`. When `reset` is
declared, every runner an asynchronous task can use removes those paths
before every operation and keeps the removal out of CPU, system CPU, elapsed
time and the time that counts towards `minMs`; it refuses a reset path
outside `BENCH_FILES`, and every round also reports `systemCpuMs`. The warm
baseline runs without the reset. (JavaScript, Python and awaited Rust have
their own runners for this kind; Ruby, Go and blocking Rust use the
synchronous ones, which already do it.)

How this meets concurrency:

- Operations are never in flight together. The runner awaits one before it
  starts the next, so the reset happens between operations with nothing of
  the task running. An operation must therefore not leave writers behind:
  whatever it started has finished, and closed its files, when its result is
  returned (the first rule above). The result should include what was
  written (a count of files, a size), so the verifier sees it.
- Inside one operation, units that are in flight together write to different
  paths, all under the reset paths (for example `out/<i>.txt` for unit `i`,
  with `reset: ['out']`). The scenario gives the destination; the adapters
  derive the per-unit names the same way.
- The verification calls come before any reset, one per fixture, so each
  fixture needs a destination of its own, as in a synchronous task.
- File-system work waits on the kernel. A round of an operation that writes
  can use much less CPU than wall-clock time without sleeping; if the
  "operations wait instead of working" check (rule 2) refuses an honest task
  for that reason, report it instead of working around it.

### A minimal adapter in each language

JavaScript (`adapter.js`; runs on node, bun and deno). Export an `operation`
that returns a promise, and optionally `prepare`:

```js
import pLimit from 'p-limit'
import { setImmediate } from 'node:timers'
const turn = () => new Promise((resolve) => setImmediate(resolve))
export async function operation({ values, limit }) {
  const run = pLimit(limit)
  return Promise.all(values.map((value) => run(async () => { await turn(); return value * 2 + 1 })))
}
```

Python (`builtin/<name>/adapter.py`, `"language": "python"`,
`"runtimes": ["cpython", "pypy"]`). `async def operation` is awaited on one
asyncio loop; a plain `def operation` is called and must join its threads.
Annotate every `async def` yourself, as below: the type check adds
annotations to plain `def` only, and mypy rejects an `async def` without them:

```python
import asyncio
from typing import Any
async def operation(value: Any) -> Any:
    semaphore = asyncio.Semaphore(value["limit"])
    async def job(v: Any) -> Any:
        async with semaphore:
            await asyncio.sleep(0)
            return v * 2 + 1
    return await asyncio.gather(*[job(v) for v in value["values"]])
```

Go (`builtin/<name>/adapter.go`, `"language": "go"`, `"runtimes": ["go"]`).
`operation` blocks until its goroutines are done; `prepare` is optional.
Shared counters must be atomic or locked whatever `threads` is:

```go
package main
import "sync"
func operation(value any) any {
	values := value.(map[string]any)["values"].([]any)
	results := make([]float64, len(values))
	var wg sync.WaitGroup
	for i, v := range values {
		wg.Add(1)
		go func(i int, v float64) { defer wg.Done(); results[i] = v*2 + 1 }(i, v.(float64))
	}
	wg.Wait()
	return results
}
```

Ruby (`builtin/<name>/adapter.rb`, `"language": "ruby"`,
`"runtimes": ["ruby", "ruby-yjit"]`). Ruby has no event loop in its standard
library, so `operation` blocks and joins its threads. Sorbet rejects a
variable that changes type inside a block (`ok = true` and later
`ok = false`): count failures in an integer instead:

```ruby
def operation(value)
  queue = Thread::SizedQueue.new(value['capacity'])
  producer = Thread.new { value['messages'].times { |i| queue.push(i) } }
  sum = 0
  value['messages'].times { sum += queue.pop }
  producer.join
  sum
end
```

Rust, an operation that is a future (`cargo/<crate>/src/main.rs`):
`bench_harness::async_operation::run(block_on, prepare, operation, consume, describe)`.
`block_on` is given one future, the whole run, and must drive it to the end;
`operation` takes a `&'static` prepared input and returns a future of a
`Result`:

```rust
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

async fn operation(input: &'static Vec<u64>) -> Result<Vec<u64>, tokio::task::JoinError> {
    let handles: Vec<_> = input.iter().map(|&v| tokio::spawn(async move { tokio::task::yield_now().await; v * 2 + 1 })).collect();
    let mut results = Vec::with_capacity(handles.len());
    for handle in handles { results.push(handle.await?); }
    Ok(results)
}

fn main() {
    let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    bench_harness::async_operation::run(
        |main| runtime.block_on(main),
        |input: &Value| input["values"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap()).collect::<Vec<u64>>(),
        operation,
        |results| results.len() as u32,   // timed: read something cheap
        |_, results| json!(results),      // not timed: JSON for the verifier
    );
}
```

Rust, an operation that blocks on threads: the synchronous
`bench_harness::operation::run_prepared(prepare, operation, consume, describe)`,
with `std::thread::scope` inside `operation`, as in
`message-channels/bounded-mpsc-threads/cargo/crossbeam-channel`.

`Cargo.toml` is that of any cargo adapter (the harness with
`features = ["operations"]`, `serde_json`, the crate, and its runtime with
only the features used, for example
`tokio = { version = "1", features = ["rt", "sync"] }`). A new cargo adapter
is a new member of the workspace, and `Cargo.lock` must list it before
anything builds. That is the one step outside your folder, and it compiles
nothing: run `node scripts/lock-crates.mjs` (it adds the new member to the
lock, downloads no source, and steps back any release younger than seven
days). Never edit `Cargo.lock` by hand, and never run a cargo command
yourself, `cargo build`, `cargo add`, `cargo update` and `cargo metadata`
included: `scripts/measure.mjs` builds, after
checking the age of every locked crate.

### How to check

```sh
node scripts/measure.mjs <category>/<task> --check
```

Every adapter must print `works` on every runtime it lists; the command
records nothing and may be run on a busy machine. What the failures mean:

- `verify-failed: ... fixture N: ...`: the result is wrong. For a limiter or
  a pool, look first at whether the unit of work really yields (rule 3).
- `failed: the operations wait instead of working`: something sleeps or uses
  a timer (rule 2).
- `timed out waiting for "round"`: an operation never finished: a promise
  that is never settled, a thread never joined, a channel never drained.
  It is also what a batch longer than 30 seconds gives: one pass over the
  fixtures must take well under that on the slowest runtime.
- `an async-operation task needs load.threads`: `task.json` (rule 4).

Run the check several times for adapters with threads or goroutines: a result
that depends on timing must pass every time, or the check is too strict for
what the task defines. Do not measure (the command without `--check`) unless
asked to.

A package from PyPI, RubyGems or the Go module proxy is written as the section
above says and is run by the same runners as the `builtin` entries here; no
such adapter has been tried in a task of this kind yet.

The `builtin` Python, Ruby and Go adapters must also pass their type
checkers. This runs each once and records nothing; it must end with
`0 rejected`:

```sh
node scripts/measure-native-checks.mjs --verify --only=<category>/<task>
```

Not covered yet: a Rust standard-library entry (there is no `builtin` path
for Rust, so `std::sync::mpsc` or `std::sync::Mutex` cannot be listed), and
the type check of a PyPI, RubyGems or Go module adapter in a task of this
kind (`scripts/measure-native-checks.mjs` takes those from synchronous tasks
only).


## Tasks on the file system

A task whose job is done on files (walk a tree, expand a pattern against a
directory, copy, archive to a file, write a file) declares the files it
needs. The harness creates them, hands the adapter paths, and removes them.
Two finished examples to copy from: `directory-walking/mixed-trees` (reads)
and `recursive-file-copy/small-trees` (writes).

Use this only when the package's job is on the file system. If the package
takes bytes or a string and a file would only be a way to get them, write a
plain task and give the bytes as a fixture (see `prepare` under "Synchronous
operations").

### How it works

- **Where.** `.cache/scratch/<category>/<task>/`, inside the repository: one
  fixed path per task, the same for every adapter, runtime and language, so
  path lengths and the disk are the same for every entry. Not the system's
  temporary directory, which can be another kind of file system. The script
  prints the kind once (`on apfs`). The path is in the environment variable
  `BENCH_FILES` when `scenario.mjs` is loaded and in every adapter process.
- **When.** The scripts remove the directory, create every declared file and
  directory, start one adapter process, and remove the directory when that
  process ends, also when it fails. So each process (each of the three runs of
  each adapter on each runtime) gets files that nothing has touched. Creating
  and removing happen in the measuring script, never in the adapter process.
  Every file and directory gets the same modification time (2026-01-01 UTC).
- **Writes.** A scenario lists under `reset` the paths its operations create.
  The runner removes them before every operation: before each call of the
  warm-up, of the rehearsal and of the measured rounds. The removal is not
  timed: it is taken out of the CPU time, the system CPU time and the elapsed
  time of the round, and a round lasts until its operations alone add up to
  `minRoundMs`. Each call therefore starts from the same files.
- **Cache.** The files were written a moment before the process starts, and
  the checks, the warm-up and the rehearsal read them again before anything is
  measured. Every entry is measured with the files in the operating system's
  cache, and none reads the disk. Cold-cache cost is not measured.
- **System time.** CPU time is the process's user plus system time, as in
  every task. Here the system part is large: it is the kernel doing what the
  package asked of it. It is counted, because which calls a package makes and
  how many is the package's own doing (one walker asks about every entry,
  another reads what the directory listing already told it). Two consequences
  to state in `task.md`. Every entry pays about the same for the calls nobody
  can avoid, so classes are closer together than in a task on memory. And
  time spent waiting for the disk (`fsync`) is not CPU time and is not in the
  figure. Each round also records its system part alone (`systemCpuMs`, beside
  `cpuMs` in the raw result), so the share can be read for any entry.
- **One process, its own CPU.** Work a package hands to a child process is
  not counted. A package that does its job by running a command (`git`, `tar`)
  cannot be an entry of these tasks.

Measured shares, on macOS with APFS: in `directory-walking/mixed-trees` system time
was 85 to 93 % of the CPU time of the fastest entries (fdir, walkdir, Bun's
`readdirSync`) and 42 to 60 % of the slowest (Node's and Deno's
`readdirSync`), and eleven of the nineteen entries were within 1.4 times the
best. In `recursive-file-copy/small-trees` it was 80 to 97 % for every entry.
The slower entries spend more system time too, not only more of their own.

### Size

- Make one operation cost between about 0.5 ms and 100 ms for the fastest
  entry. Below that the fixed costs of a call drown the job; above it a round
  holds too few calls, and with its reset a warm-up may not finish in the 30
  seconds a phase is allowed.
- Reading: a few thousand entries in all. Listing a directory costs the
  kernel a fixed amount per directory and a small amount per entry, so many
  entries in few directories shows more of the package, and many tiny
  directories shows mostly the kernel. Use several cases of different shape
  (a wide one, a deep one, a realistic one) and not one shape only.
- Writing: a few hundred files and a few megabytes in all. Creating a file
  costs the kernel far more than listing one.
- Depth: keep every path under 200 characters after the scratch directory.

### Write a task: files you write

Only files under `benchmarks/<category>/`:

```
benchmarks/<category>/category.json          (if the category has none yet)
benchmarks/<category>/<task>/task.json
benchmarks/<category>/<task>/task.md
benchmarks/<category>/<task>/scenario.mjs
benchmarks/<category>/<task>/<registry>/<name>/adapter.json + the adapter
```

Copy `category.json`, `task.json` and the `adapter.json` files from one of the
two examples and change the words. In `task.json` keep `"kind":
"sync-operation"` and set `load` to:

| | reading | writing (has `reset`) |
| --- | --- | --- |
| `warmup` | 2000 | 40 |
| `rounds` | 3 | 3 |
| `operationsPerRound` | 100000 | 1000 |
| `minRoundMs` | 250 | 500 |

End the `notes` of `task.json` with one sentence that this is a task on the
file system and that CPU time includes the kernel's part.

### scenario.mjs

`scenario.mjs` is copied next to each JavaScript adapter and loaded alone, so
it imports nothing but `node:` modules. It exports:

- `files`: `{ tree, reset }`.
  - `tree` is an array. A file is `{ path, content }` with `content` a string
    or a `Uint8Array`; add `mode: 0o755` for other permission bits than 644. A
    directory that would otherwise be empty is `{ path: 'some/dir/' }` (the
    slash at the end makes it a directory). A symbolic link is `{ path, link }`
    with a target relative to the link. Paths are relative, with forward
    slashes, without `.` or `..`. Parent directories are created for you.
  - `reset` (only when operations write) is an array of relative paths that
    the runner removes before every operation. They must not be in `tree` or
    under a file of it. List the top of what is written: if operations write
    `out/a` and `out/b`, either list both or list `out` and expect every
    operation to create `out` itself.
- `cases`: as in any task. Build every path from `process.env.BENCH_FILES`:

  ```js
  const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'
  export const cases = [{ input: { root: `${scratch}/app` }, expected: [...] }]
  ```

  The scripts refuse an input that holds an absolute path outside the scratch
  directory. Keep `expected` free of the scratch path (relative paths, counts),
  and build it from the same data as `tree`, not by reading the disk.
- `verifyResults(outputs)`, `verify(operation)` and `consume(result)`: as in
  any task. Write the checks in one function that both verifiers call.

Generate names, sizes and contents with a fixed-seed generator, never
`Math.random()` or the date. Include what real trees have and careless code
drops: an empty file, an empty directory, dot files, a name with a space, a
name that is not ASCII, a deep path, and for a task that writes, a file with
mode 755 and one with mode 600.

**A task that reads** (no `reset`): the result of an operation is returned,
and the check compares it with `expected`. Operations must not create, change
or remove anything. Say in `task.md` what is forgiven because it is the same
answer in another spelling (order; absolute or relative paths) and forgive
nothing else: a missing dot file, a missing empty directory, a duplicate or a
made-up entry must fail.

**A task that writes** (has `reset`): the result is on the disk, so the check
reads the disk.

- Give every case its own destination, each listed in `reset`. The checks of
  all cases run after all cases have been called once, so two cases that wrote
  to one place would hide each other.
- In `verify(operation)`, call the operation and then check the disk, case by
  case. In `verifyResults(outputs)`, check the disk for every case and ignore
  `outputs` unless the operation also returns something. Python, Ruby, Go and
  Rust runners call every case once and then wait while `verifyResults` runs
  in the measuring script, with the files still in place.
- Compare what was written with the declared `tree` (names, bytes, permission
  bits), exactly: nothing missing and nothing extra, such as a temporary file
  left behind.
- `consume` returns `1` when an operation returns nothing.
- An operation may instead replace a declared file with the same bytes on
  every call (an atomic write). That needs no `reset`, since each call leaves
  what the next one finds.

### Adapters

An adapter is the same as in any synchronous task: `operation(input)`, in the
folders and with the `adapter.json` described above for each registry
(`npm/`, `jsr/`, `cargo/`, `pypi/`, `rubygems/`, `gomod/`, and `builtin/` for
a standard library). It is given the paths from the case's input and does the
package's job on them. Rules particular to these tasks:

- Use only paths from the input. Never the current directory, the home
  directory or the system's temporary directory. A package that needs a
  temporary directory is given one under the scratch directory by the case.
- Do the work on every call. If the package keeps what it read in an object
  (a resolver, a walker with a cache), create that object inside `operation`,
  and say so in `notes`. A cache the package keeps by itself, with no object
  to create, stays; say so in `task.md`.
- Do not sort, convert or check results in the adapter unless the task's
  common shape requires it for every entry.
- Use the package's synchronous interface. A package with only promises,
  callbacks or streams is not an entry of a `sync-operation` task: name it
  under "Left out" in `task.md`. It belongs in a task of the asynchronous
  kind, which can use the same `files` (see below).
- Finish before returning: close what was opened, and leave no thread or
  child still working. Work that continues after `operation` returns falls
  into the reset and is not counted.
- `builtin/` adapters call one documented function of the standard library
  that does the job (`shutil.copytree`, `Find.find`, `filepath.WalkDir`). If a
  language has none, it has no builtin entry: do not write the job by hand.
  If the function does not do the whole job, the check fails; leave it out and
  say why in `task.md` (Go's `os.CopyFS` in the copy example).

The smallest adapters of the examples:

```js
// builtin/node-fs-cp/adapter.js
import { cpSync } from 'node:fs'
export const operation = ({ from, to }) => cpSync(from, to, { recursive: true })
```

```python
# builtin/python-shutil-copytree/adapter.py
import shutil
def operation(input):
    shutil.copytree(input['from'], input['to'])
```

```ruby
# builtin/ruby-find/adapter.rb
require 'find'
def operation(input)
  Find.find(input['root']).to_a
end
```

```go
// builtin/go-filepath-walkdir/adapter.go: see the file; input is value.(map[string]any)["root"].(string)
```

```rust
// cargo/walkdir/src/main.rs: run_prepared(prepare, operation, consume, describe);
// prepare turns the input into a PathBuf once, describe turns paths into JSON for the check.
```

A Rust adapter for a crate that `Cargo.lock` does not hold yet cannot be
built (`cannot update the lock file`). Run `node scripts/lock-crates.mjs`:
it adds the crate to the lock, downloads no source, and steps back any
release younger than seven days. Do not run `cargo update`, `cargo add`,
`cargo metadata` or any other cargo command yourself, and do not edit
`Cargo.lock`. Crates already locked (`grep 'name = "<crate>"' Cargo.lock`)
build at once.

### Check your work

```sh
node scripts/measure.mjs <category>/<task> --check
```

It prints one `files:` line with the number of files and directories created,
then `works` for every adapter on every runtime, and exits with 0. Nothing is
left under `.cache/scratch/` afterwards. Then:

- Break one adapter on purpose (leave out the option that lists directories;
  copy to the wrong place) and see that `--check` prints `verify-failed` for
  it. Put the adapter back. A check that cannot fail is not a check.
- `the scratch directory of … is in use by process …`: another measurement of
  the same task is running. Wait for it. Different tasks can be checked at the
  same time.
- `files.reset: … overlaps the declared tree` or `… is outside the task's
  scratch directory`: fix `scenario.mjs` as the message says.
- A writing task that fails with "file exists" on a later call: the path it
  writes is not in `reset`.

Do not run `scripts/measure.mjs` without `--check`, do not create or remove
anything under `.cache/` yourself, and do not edit files outside your
category's folder.

In `task.md`, besides what every task says, state: what the trees hold (counts
by kind), what is and is not forgiven by the check, that the files are in the
operating system's cache and CPU time includes the kernel's part, and, for a
task that writes, that waiting for the disk is not counted and whether file
times are compared.

### For other kinds of task

The files do not depend on the kind of task. `scripts/measure.mjs` wraps every
launch of an adapter process, of any kind, in `fixtures.around(...)` from
`harness/files.mjs`, and both environment variables reach every process. A
scenario of the asynchronous kind declares `files` in the same way and its
adapters get the same paths; a task that only reads needs nothing more, and
one that writes gets the same reset (see "Files that operations write" under
"Asynchronous operations").

A runner for another kind (or another language) must do one thing itself to
support tasks that write. When `BENCH_FILES_RESET` is set and not empty, it is
a JSON array of absolute paths. Before every operation the runner removes
each of them (a file or a whole directory; a missing one is not an error) and
keeps that out of what it times: CPU, system CPU and elapsed time, and the
time that counts towards `minMs`. It refuses to start if a path does not
begin with `BENCH_FILES` plus `/`. With several operations in flight at once,
each needs its own destination and the reset can only run between batches;
such a task is better written with one operation at a time. In an
asynchronous operation task it never arises: the runner awaits each operation
before it starts the next, so the reset always runs with nothing in flight,
and the concurrency is inside one operation. The five
synchronous runners (`harness/js/operation-runner.mjs`, `harness/python/runner.py`,
`harness/ruby/runner.rb`, `harness/go/runner.go`, `harness/rust/src/operation.rs`)
show how; `harness/tests/files.test.mjs` tests each. The three asynchronous
ones (`harness/js/async-operation-runner.mjs`, `harness/python/async-runner.py`,
`harness/rust/src/async_operation.rs`) do the same and
`harness/tests/async-files.test.mjs` tests them. The warm baseline runs
without the reset.

Not provided: restoring a changed file to its first contents between
operations (only removal), files larger than memory, and anything outside the
scratch directory.

## Tasks whose output differs between packages

Some jobs have no single right output: two correct highlighters write
different markup, two XML writers different bytes, two graph libraries
different valid orders, two resizers different pixels. Such a task is still
written as an ordinary task (most are `sync-operation`); what changes is the
check. The rule is: **strict about the job, neutral about the style.** A
correct library must pass whatever its style; an output that did not do the
job must fail.

### Choose the pattern

| The outputs differ because | Pattern | Worked example |
| --- | --- | --- |
| The same content can be written in several ways (markup, quoting, entity spellings, key order, white space) | 1. Read the output back and compare the content | `xml-building/build-document`, `source-map-generation/record-mappings` |
| The output is styled and the styling vocabulary is the library's own | 2. Read the output back and check that it tells apart what must be told apart | `syntax-highlighting/highlight-to-html` |
| Each library has its own tree or result type for the same parse | 3. Map to a small common shape and compare that | `sql-parsing/parse-statements` |
| The output is binary and numerically different but equally good | 4. Decode it and compare with a reference within a tolerance | `image-processing/png-thumbnail` |
| Many answers are valid | 5. Check the properties that make an answer valid | `graph-algorithms/topological-sort` |
| The specification leaves a detail open | 6. Compute the expected output from a reference and list the accepted variants | `uri-template-expansion/rfc6570-expansion` |

Read the example's `scenario.mjs` and `task.md` before writing your own; each
is short. What follows is what they have in common and the mistakes to avoid.

### Rules for every pattern

1. **The adapter returns what the library returns.** The normalizing, parsing
   back, decoding and comparing all happen in `verifyResults` in
   `scenario.mjs`, which runs once per fixture before any measured work. An
   adapter never normalizes its output to help the check. (Pattern 3 is the
   one exception, and there every adapter does the same small mapping.)
2. **The scenario knows the answer without a library.** Either the generator
   records the truth while it writes the fixture (where the comments are in a
   source file, which tables a statement names, the pixels it drew), or the
   scenario has its own small reference (an RFC 6570 expander, a block
   average). Never take one package's output as the expected value.
3. **Write the reader in the scenario, strictly.** `scenario.mjs` is the only
   file copied beside an adapter, so it must be self-contained: Node built-ins
   only (`node:assert`, `node:zlib`, `node:buffer`; import `Buffer` explicitly, so
   it is there on every runtime). The reader accepts every correct spelling and rejects
   anything malformed: the XML reader fails on an unknown entity, the PNG
   reader on a bad CRC.
4. **Export `verifyOne(i, output)`** and have `verifyResults` call it for each
   fixture. It makes it possible to list every failing fixture of an adapter
   while you work, instead of only the first.
5. **Prove the check can fail.** Before you trust it, run it on outputs that
   did not do the job: the input returned unchanged, an escape-only or
   regular-expression version, a point-sampled thumbnail, the node list in
   input order. If one passes, the check is not strict yet. Where it is cheap,
   keep the proof in the scenario (`topological-sort` asserts at load that the
   node list is not a valid answer).
6. **Write every accepted difference in `task.md`,** under "What counts as
   correct", with the reason it is style and not substance. If you cannot say
   why a difference is harmless, it is not accepted.
7. **When packages disagree on substance, find out who is right.** Read the
   specification. Then one of three things:
   - One package is wrong and the others agree: keep the fixture. The package
     is recorded as not passing, with the failing case in `notes` and the
     account in `details`. (`node-sql-parser` groups `a OR b AND c` wrongly;
     `uri-template-lite` gets an RFC example wrong; `image-js` does not
     average.) If an option fixes it, add a variant beside it, as in
     `css-parsing/error-recovery`; `xml-building` has one for
     `fast-xml-parser`, whose default drops attributes.
   - The specification is silent or the packages split evenly on something
     marginal: leave it out of the fixtures and say so in `task.md`, with which
     package does what. (An empty list in a URI template; a tab inside an XML
     attribute value.) Do not bend the check to accept a wrong answer.
   - It is the heart of the job and no two packages agree: the category is not
     benchmarkable as one task. Say so; do not write a check that passes
     everything.
8. **A tolerance is measured, not guessed.** Run every candidate, in every
   mode it has, and print the error of each against the reference. Put the
   limit in a gap, and write both sides of the gap in `task.md`
   (`png-thumbnail`: area filters 0.4 to 1.3, the limit 2, point sampling 3.3
   and up). No gap means the fixtures do not separate right from wrong yet:
   change the fixtures, not the limit.
9. **Different work for the same job is reported, not hidden.** A highlighter
   that resolves a theme does more than one that writes class names; a writer
   that builds a tree first does more than one that streams. If each is the
   library's normal way, both are measured as they are and `task.md` says what
   differs.

### 1. Read the output back and compare the content

For text that carries structure: XML, JSON, a source map, CSV, a rendered
table, generated code. Write the smallest strict reader for the format in the
scenario and compare what it yields with the fixture.

- Compare what a consumer of the format would see. For XML that is names,
  attributes as a set, and character data with references resolved; not the
  declaration, quoting, or `<a/>` against `<a></a>`.
- Decide what white space means before you write the generator. In
  `build-document` no element has both text and children, so white space
  between children is formatting and text is compared exactly, spaces included.
- Where a format has indexes into its own tables (a source map's `sources`
  and `names`), resolve them through the output's own tables, so that any
  table order is accepted.
- A result may be an object in one language and text in another; the verifier
  parses text first. Say in `task.md` what extra work that implies.

### 2. Check that the output tells apart what must be told apart

For highlighted code, coloured terminal output, annotated text: the library
chooses the names and colours. Do not keep a table of every library's class
names. Instead:

- Have the generator record probes while it writes the fixture: ranges that
  are certainly a comment, a string, a keyword, a number, a plain identifier.
  Probe only the body of a token (not quotes or comment markers), skip white
  space, and probe only what every grammar agrees on.
- In the verifier, give every character a styling: the attributes of the
  innermost styled element around it. Require that the text with tags removed
  is the source, and that no styling is shared between kinds that must differ.
- Put the traps in the fixtures: a quote inside a comment, a comment marker
  inside a string, an escaped quote. A tokenizer that falls for one gives two
  kinds the same styling.

The same idea fits ANSI output (the styling is the active escape codes) and
any "annotate this text" job.

### 3. Map to a small common shape

For parsers: SQL, Ruby, expressions, queries, any syntax tree.

- Design the shape from the job, not from one library's tree: a few fields
  that only a real parse can fill (statement kind, names in order, counts) and
  one part compared deeply. In `parse-statements` that is the WHERE condition,
  where precedence and parentheses show whether a tree was built.
- Every adapter does the mapping inside the timed call, in every language
  alike, and it must be small beside the parse: property reads and one walk
  over the part compared deeply. No string building, no sorting. Rust builds a
  struct in the call and turns it into JSON in `describe`, outside it.
- Let the verifier absorb spelling: operator names in any case, `!=` for
  `<>`, a string literal raw or unescaped, an associative chain grouped either
  way (flatten it before comparing). Then the adapter passes the library's
  values through untouched.
- Keep the fixtures inside the syntax every dialect reads, and let most of
  each fixture be syntax that is parsed but only counted (select lists, joins,
  values), so the parse is realistic while the comparison stays small.

### 4. Decode a binary output and compare within a tolerance

For images, audio, compressed data with a lossy step, documents such as PDF.

- The scenario draws the input itself and so knows the ideal output. Write the
  decoder in the scenario for exactly what outputs may be (a PNG reader for
  8-bit colour types; for PDF: the header, the cross-reference table or
  stream, the page tree, and the text operators of each page's content stream
  after inflating it).
- Check the exact things exactly (dimensions, page count, the text of each
  page) and the numeric things against the reference with a measured limit
  (rule 8).
- Draw fixtures on which every sound method agrees: no detail finer than the
  output can show, no transparency where premultiplication would matter, a
  whole-number reduction so the reference is a plain block average.
- Bytes cross to the verifier as base64 text from Rust, Go, Python and Ruby
  (`describe`), and into the adapter as hex decoded in `prepare`.
- Where a library needs a choice it has no default for (a filter, a font),
  name one in `task.md`, use the same in every such entry, and prefer the
  default of the entry that has one.

### 5. Check the properties of a valid answer

For jobs with many right answers: a topological order, a shortest path (its
length is unique, its route is not), a set of components, a schedule, a
solution to constraints, generated test data.

- List the properties that together are the definition of a correct answer
  and check all of them (`topological-sort`: every node exactly once, every
  edge forward). One property alone is usually passable by a wrong answer.
- Compare unordered things as sets: components as a set of sets, not a list.
- For generated data (fake names and addresses), where even the content is
  free: check the shape of every record (types, formats by pattern, ranges),
  that the same seed gives the same records twice, that a different seed gives
  different ones, and that values vary (a minimum number of distinct values per
  field). Say plainly in `task.md` that the libraries do not generate the same
  data and that this is a comparison of producing N records of a given shape.

### 6. A reference with listed variants

For jobs with a specification and test vectors (RFC 6570, a checksum, an
encoding): write a small reference in the scenario, check the reference
against the specification's own examples when the scenario loads, and compute
every expected value with it. Where the specification leaves something open
(the order of a map's pairs), compute each permitted output and accept any of
them. Add realistic fixtures beside the examples; the examples alone are
usually too small and too regular to measure.

Where a reference cannot be written in the scenario (a tokenizer's vocabulary
of 100,000 entries), record the expected outputs once, keep only those on
which at least two independent implementations agree, embed them, and say in
`task.md` which implementations and versions they came from.

### When there is no fair check

Say so in the backlog, with the reason, and write nothing. That is a result.
A category is not benchmarkable as one task when the packages do not do the
same job (an edit-tracking source-map builder beside a mapping recorder: two
tasks), when the libraries only exist in one language and each has its own
input language (object pickling of closures is a Python-only comparison, which
is allowed, but say that it is), or when a check strict enough to reject wrong
output would also reject correct libraries.

### A child process is still a synchronous task

`process-execution/spawn-collect` shows it: the adapter calls the library's
synchronous form, and the figure is the calling process's CPU. Every runner
reads its own process's CPU time, so the child's is left out without any
harness change; say in `task.md` that this is on purpose (the child is the
same in every entry), give an absolute path to a program that exists on every
machine, and raise `minRoundMs`, because a round holds few calls.

### Decisions for the categories that waited for one

Each of these was put aside for a design decision, a check, or a reason that
did not hold. "Written" means the task exists and is the example to copy.
For the others the decision is made and the task is still to write; the
gaps are those of `BACKLOG.md` (a: PyPI, RubyGems and Go-module adapters, b:
asynchronous operations, c: files, d: a local peer).

| Category | One task measures | Correct means | Kind, pattern | State |
| --- | --- | --- | --- | --- |
| `uri-template-expansion` | Parse and expand one RFC 6570 template with a variable set | Equal to the scenario's reference expander; both orders of a map's pairs accepted | sync, 6 | Written: `rfc6570-expansion` |
| `syntax-highlighting` | Highlight one source file to HTML, language given | Visible text is the source; comment, string, keyword and number never share a styling | sync, 2 | Written: `highlight-to-html` |
| `xml-building` | Build a document from an element tree and serialize it | Read back with a strict reader: same elements, attributes as a set, exact text | sync, 1 | Written: `build-document` |
| `sql-parsing` | Parse one statement | Kind, tables, columns, counts and the WHERE tree, in a common shape | sync, 3 | Written: `parse-statements` |
| `image-processing` | Decode a PNG, scale down by a whole factor, encode a PNG | Decoded: exact size, mean error from the block average at most 2 levels | sync, 4 | Written: `png-thumbnail`. `sharp`, `jimp`, `imagescript`, `@cross/image` need b |
| `source-map-generation` | Add every mapping, produce the encoded map | Mappings decoded and resolved through the output's own lists equal the fixture's | sync, 1 | Written: `record-mappings`. `magic-string` is another job: a second task `track-edits` with the same check |
| `graph-algorithms` | Build a DAG from an edge list, return a topological order | Every node once, every edge forward | sync, 5 | Written: `topological-sort`. A second task for components: compare as a set of sets |
| `process-execution` | Run `/bin/echo` with arguments, collect output and status | Exact output (final newline optional) and status 0 | sync; the caller's CPU only | Written: `spawn-collect`. The asynchronous forms need b, same fixtures |
| `expression-evaluation` | Parse one expression and evaluate it against 8 variable sets | Each value within 1e-9 of the scenario's own evaluation of the tree it generated | sync, 6 | To write. Arithmetic (`+ - * /`, unary minus, parentheses), comparisons, `min`, `max`, `abs`; every literal and variable a float. Left out because the libraries disagree: power (`^` or `**`), `and`/`or` spellings, integer division, modulo. npm `expr-eval`, `mathjs`, `jexl` (`evalSync`), `filtrex`; crates `evalexpr`, `meval`, `fasteval`. `cexpr`, `cfg-expr` and `boolean.py` do other jobs and stay out. `govaluate`, `cel-go`, `simpleeval` need a |
| `pdf-generation` | Write 20 pages of positioned lines of text and a ruled table, standard Helvetica, A4 | Decoded: page count, page size within a point, and the text shown on each page (`Tj`, `TJ`, `'`, `"` strings of the inflated content streams, WinAnsi) equal to the fixture's lines in order | sync, 4 | To write. Lines come already broken and positioned, because line breaking differs. ASCII and Latin-1 text only, no embedded fonts. npm `jspdf`, crate `printpdf` now; `reportlab`, `fpdf2`, `prawn`, `gofpdf` need a; `pdfkit`, `pdf-lib`, `pdfmake` need b. HTML to PDF (`weasyprint`, `wicked_pdf`) is another job; `wicked_pdf` runs an external program and stays out. `combine_pdf` and `pydyf` (no text layout) stay out |
| `chart-rendering` | Render a line chart of 5 series of 500 points to SVG at a given size | Parsed SVG: the size asked for; for each series one path or polyline of 500 vertices that is an affine image of the data (residual at most half a pixel) with the y axis flipped; one mapping for all series; everything inside the canvas | sync, 1 and 5 | To write; the hardest here. The reader must handle path commands (absolute and relative) and `transform` on groups. npm `echarts` (server-side SVG string), crates `plotters`, `charts-rs` now; `matplotlib`, `leather`, `gonum/plot` need a. PNG output is not benchmarkable: rasterizers and fonts differ and no pixel check is fair. `svgo` (drawing primitives), `sparklines` (terminal) and `seaborn` (a layer over matplotlib) stay out; `plotly` and `altair` need an external renderer for SVG |
| `fake-data-generation` | With a given seed, generate 100 records of name, email, street and date | Every record has the shape (non-empty strings, an email by pattern, an ISO date in range); two fixtures with the same seed give the same records; different seeds differ; at least half the names are distinct | sync, 5 | To write. State that the libraries do not produce the same data. npm `@faker-js/faker`, `chance`; crate `fake`; `faker` (PyPI, RubyGems) and `ffaker` need a. `factory-boy` builds objects from factories and stays out; `@laura/testdata-generator` only if it can be seeded |
| `dataframes` | On a 20,000-row table built once per fixture in `prepare`: filter, group by a key, sum and mean | Rows compared as a set by key; integer sums exact, means within 1e-9 | sync, 1 | To write. Building the table is not timed and `task.md` says so. npm `arquero`, `data-forge`, `nodejs-polars`; crate `polars`. `pandas`, `polars`, `pyarrow`, `duckdb`, `agate` need a; `@nshiab/simple-data-analysis` needs b. `arrow` alone has no group-by; `narwhals`, `pyspark`, `dask` stay out |
| `embedded-script-interpreters` | Run one script in a fresh context and read its result back | Exact value (a number, a string) | sync, exact | To write, **one task per guest language**: the script is the input, so a Lua run is never compared with a JavaScript run. `javascript-guest`: `quickjs-emscripten`, crates `boa_engine`, `rquickjs`; `goja` needs a. `lua-guest`: `fengari`, crates `mlua`, `piccolo`; `gopher-lua` needs a. Starlark: crate `starlark`; `go.starlark.net` needs a. Scripts: recursive `fib(22)`, sorting 2,000 numbers, building a string. `@eyurtsev/pyodide-sandbox` runs Python, alone, asynchronously: out |
| `message-translation` | 50 lookups with interpolation and plural selection against a catalog loaded once per fixture | Exact strings | sync, 6 | To write, as **two tasks**, because there are two models. `gettext-catalog` (msgid and plural forms; the scenario writes the `.mo` bytes): `jed`, `node-gettext`, crate `gettext`; `fast_gettext`, `gettext`, `babel`, `gettext-go` need a. `keyed-messages` (key, named placeholders, CLDR plural categories; the scenario gives a neutral catalog and each adapter converts it in `prepare`): `i18next`, `node-polyglot`, `@locale-kit/locale-kit`; `i18n`, `universal-translator` need a. Locales en and ru, whole numbers only, so gettext's and CLDR's plural rules agree. `@moductor/libintl` (binds the system library) and `@axhxrx/internationalization` (TypeScript modules as catalogs) stay out |
| `subword-tokenization` | Encode one text to token ids with `cl100k_base` and decode it back | Ids equal to recorded ones; decoding gives the text | sync, 6 with recorded outputs | To write. The vocabulary is too large for a reference in the scenario: record the ids once, only where two independent implementations agree, and say in `task.md` where they came from. npm `gpt-tokenizer`, `js-tiktoken`, `tiktoken`; crate `tiktoken-rs` (all carry the vocabulary). PyPI `tiktoken` fetches it over the network on first use and needs a and c; `tokenizers` and `sentencepiece` need a model file (c) and a task of their own. `@wangb/vibrato-deno` is a morphological analyzer: out |
| `ruby-parsing` | Parse one Ruby source file | A common shape: the classes, modules and methods defined, in order, with nesting path, line and parameter names | sync, 3 | To write. Standard library Ripper and Prism (bundled since Ruby 3.3), npm `@ruby/prism` (WebAssembly), crate `lib-ruby-parser` now; gems `parser`, `ruby_parser`, `prism` need a. Do not count call nodes: the parsers disagree on what a call is |
| `typed-object-mapping` | Turn plain nested data into declared record objects and back | The round trip equals the input (dates as ISO text), and `describe` reports the class of the object at three places, so returning the input fails | sync, 1 and 3 | To write. npm `class-transformer`, `serializr`; crate `serde_json` (`from_value`, `to_value`) now. `cattrs`, `mashumaro`, `typedload`, `marshmallow`, `dataclasses-json`, `dry-struct`, `virtus` need a. `dacite` and `mapstructure` only load: a second task `load-records`. `proto-plus`, `py-serializable`, `coercible`, `envconfig` stay out |
| `object-json-serialization` | Serialize 50 records (ten attributes, a nested list) through a serializer declared once | The JSON text, parsed, equals the expected structure | sync, 1 | Needs a: every package is a gem (`representable`, `jbuilder`, `active_model_serializers`, `grape-entity`). A Ruby-only comparison, which is fine. `jsonapi-renderer` writes JSON:API documents, another shape: out |
| `dynamic-attribute-objects` | Wrap a nested hash, read 200 and write 50 attributes by method call, convert back | Exact values and final hash (keys compared as text) | sync, exact | Needs a: `hashie`, `recursive-open-struct`, `snaky_hash`, beside the standard library's OpenStruct. A Ruby-only comparison. `objx` (Go) reads by path string, a different interface: out. Wrapping is inside the call: some wrap eagerly, some on first read, and both must be counted |
| `object-pickling` | Serialize and restore a graph of 2,000 class instances with shared references and a cycle | `describe` walks the restored graph: field values, and which references are the same object | sync, 3 | Needs a: `cloudpickle`, `dill`, `jsonpickle`, beside the standard library's `pickle`. A Python-only comparison; no other ecosystem serializes closures. A second task `closures` (restore functions and call them): `cloudpickle`, `dill`; `pickle` is recorded as not passing. `tblib` (tracebacks): out |

## Strict and lenient tasks

A strict check turns a package away for one edge case, and the package then
has no figure at all: a JSON Patch library that applies every valid patch but
does not reject a `remove` of a missing member, an HTML converter that loses
one space beside an inline element. The failure is real and stays on record.
But the package still does the job most people use it for, and readers want to
know what that costs.

So a task can have a second, lenient task beside it. Both run the same
adapters on the same inputs. The strict task says who conforms. The lenient
task gives a class to every package that does the job apart from one stated
kind of difference. A package that passes both is listed in both; one that
passes only the lenient task is listed there, with a note that it does not
pass the strict task and why.

Three pairs to copy from:

| Strict | Lenient | What the lenient task does |
| --- | --- | --- |
| `json-patch/apply-patch` | `json-patch/apply-patch-lenient` | Leaves out the patches that must be rejected; accepts a `copy` that shares its value |
| `html-to-markdown/documents` | `html-to-markdown/documents-lenient` | Same fragments; white space inside and beside inline elements is not compared |
| `css-selector-matching/document-queries` | `css-selector-matching/document-queries-lenient` | Leaves out the selectors of Selectors Level 4 |

### When to add one

Add a lenient task when at least two packages fail the strict task for a
reason that can be stated as one kind of difference, and that a reader could
fairly call "does the job, apart from this".

Do not add one when:

- The failing packages give wrong answers: a charset detector that names the
  wrong encoding, a type lookup with a missing entry, a formatter that rounds
  to another unit. A lenient task that accepted some share of right answers
  would be a score, not a check. Those packages stay recorded as not passing.
- The only failing entries are packages with default options that already
  have a passing variant beside them (`variantOf`, see rule 7 under "Tasks
  whose output differs between packages"). The variant is the answer.
- Only one package would be rescued. Record it as not passing.
- The difference is the heart of the job (see "When there is no fair check").

Decided against so far, for those reasons: `charset-detection/legacy-corpus`
and `file-type-detection/first-bytes` (wrong answers),
`mime-type-lookup/extensions-from-types` (a wrong extension and a missing
entry), `human-size-formatting/byte-counts` (one package rounds too coarsely,
one writes another format, the others have passing variants),
`markdown-parsing/commonmark-to-html` and both `schema-validation` tasks (only
default-option entries with passing variants, and one package alone), and
`json-path-query/evaluate-queries` (nothing fails).

### What a lenient task may forgive

1. **One class of difference, written down.** `task.md` says exactly what is
   left out or forgiven compared with the strict task, and why it is one kind
   of thing ("no patch has to be rejected", "white space beside an inline
   element", "Selectors Level 3 only"). Never "whatever these packages get
   wrong": the rule must be one that a package not yet written could be judged
   by. Write the rule into the scenario as a rule (a predicate over the
   fixtures, a pattern), and assert there which fixtures it removes.
2. **The timed work stays the same.** Prefer forgiving in the check to
   removing fixtures, so both tasks time the same inputs and their figures can
   be read side by side. Remove a fixture only where a package's behaviour on
   it is an error or a crash (a selector it refuses to compile), or where the
   work on it is different work (a patch that must be rejected ends in an
   error path). Never change a fixture: one that stays is the strict task's,
   byte for byte. `kind`, `load` and `metrics` are the strict task's.
3. **It is still a real check.** Everything the rule does not name is compared
   as strictly as before. The scenario proves it when it loads
   (`assert.throws`): the input returned unchanged, a constant, another
   fixture's result and a result with the substance changed must all fail;
   an output with the forgiven difference must pass here, and fail the strict
   check where that can be shown.
4. **An entry that still fails is still recorded.** A package that fails the
   lenient task for another reason (`immutable-json-patch`, `html-to-md`) is
   not passing in both, and `task.md` says why the difference is not of the
   forgiven kind. Do not widen the rule to let it in.
5. **The adapters are not touched.** The lenient task runs the strict task's
   adapters as they are. If an adapter would have to change to pass, that is
   a variant in the strict task, not a lenient task.

### Files

A lenient task is a folder beside the strict one, with no adapter folders:

```
benchmarks/<category>/<task>/                 the strict task, with the adapters
benchmarks/<category>/<task>-lenient/task.json
benchmarks/<category>/<task>-lenient/task.md
benchmarks/<category>/<task>-lenient/scenario.mjs
```

`task.json` of the lenient task is the strict one's (`kind`, `load`,
`metrics`) with its own `task`, `title` ("…, lenient"), `summary`,
`fixtureCount`, and three fields:

```json
"strictness": "lenient",
"pairedWith": "<category>/<task>",
"adaptersFrom": "<category>/<task>",
```

and the strict task gets two, and ", strict" at the end of its `title`:

```json
"strictness": "strict",
"pairedWith": "<category>/<task>-lenient",
```

- `adaptersFrom` makes the scripts run that task's adapters for this one.
  Results go under `results/<category>/<task>-lenient/`, working folders
  under `.cache/work/<category>/<task>-lenient/`, and the fixtures given to
  Rust, Go, Python and Ruby adapters are this task's. A Rust adapter is the
  same binary for both tasks: it reads its fixtures from the file it is
  given. Locks (`lock.json`, `go.mod`) and type checks stay with the adapter,
  in the strict task's folder: nothing is checked twice, and the lenient
  task's entries show the strict task's check. Variants (`variantOf`) and
  entries recorded as not passing work as in the strict task. A change to an
  adapter, or to the strict scenario, marks the results of both tasks for
  measuring again.
- `strictness` and `pairedWith` are for the site: each task's page names the
  other and lists the entries that pass only the lenient one, and such an
  entry's note begins "Does not pass the strict task:" followed by the
  adapter's `notes`. So the `notes` of an adapter that fails the strict task
  must give the reason in a way that reads well after those words.
- While you write the task, add `"draft": true`. The measuring loop
  (`scripts/unmeasured.mjs`) passes over a draft, so nothing is measured with
  a check that may still change. `--check` works on a draft. Remove the field
  when the task is final.

`scenario.mjs` imports the strict scenario and derives everything from it.
Do not copy fixture data, the generator or the reader:

```js
import { cases as strictCases, consume as strictConsume } from '../<task>/scenario.mjs'
export const cases = strictCases.filter(keep).map(({ input, expected }) => ({ input, expected }))
export const verifyOne = (i, output) => { /* the strict comparison, minus the stated class */ }
export const verifyResults = (outputs) => { /* length, then verifyOne for each */ }
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = strictConsume
```

That one import, written exactly as `'../<task>/scenario.mjs'`, is the only
import besides `node:` modules. Beside a JavaScript adapter the scripts put
the strict scenario as `scenario.from.mjs` and point the import at it. If the
strict scenario does not export what you need (its reference, its reader, its
expected values), either derive it from what it does export and check your
derivation against the strict check when the scenario loads
(`documents-lenient` reads the HTML fragments itself and passes each reading
through the strict `verifyOne`), or add a small export or parameter to the
strict scenario without changing its fixtures (`apply-patch` gives its
reference a `duplicate` parameter). The second changes the strict scenario's
fingerprint, so the strict task is measured again; say so when you do it.

Always export `verifyResults`: adapters in Rust, Go, Python and Ruby hand
their outputs to it. (A Rust adapter that uses the plain `operation::run`
compares with each case's `expected` inside the binary and cannot be forgiven
anything; the lenient task can still remove fixtures for it.)

In `task.md` write, in this order: that it is the lenient form of which task
and runs its adapters; what differs from the strict task, item by item, each
with whether it is removed or forgiven and why; what is still compared; which
entries pass only here; which still do not pass and why their difference is
not of the forgiven kind. Add a line to the strict task's `task.md` that
points to the lenient one.

### Check your work

```sh
node scripts/measure.mjs <category>/<task> --check
node scripts/measure.mjs <category>/<task>-lenient --check
```

Every entry that prints `works` for the strict task must print `works` for
the lenient one, on every runtime. The entries you meant to rescue must print
`works` for the lenient task; if one does not, read why before touching the
rule (it may fail for a second reason, which then goes into its `details`).

## Client tasks

A client library needs something to talk to. A task of kind `client` is the
mirror image of an HTTP server task: there the harness is the client of the
adapter, here it provides the adapter's peer.
`node scripts/measure.mjs http-client/get-json --check` tries one.

### The method

- **The peer** is a scripted program, the same one for every adapter in every
  language. The harness starts it in its own process before the adapter's
  process exists, on `127.0.0.1` and a port the system picks, and stops it
  when the run ends, also when the run fails; a peer exits by itself when its
  supervisor is gone. Only the adapter's process is measured, so the peer's
  work is charged to nobody. A peer speaks just enough of its protocol for
  the task, its answers are fixed by the task's script, and it is strict:
  whatever it does not expect is refused and recorded, and a run with a
  recorded refusal fails.
- **One operation is one exchange**: a request and its whole response, turned
  into the value the task names (a parsed document, a reply). It is counted
  as a request (`cpuPerRequestUs`).
- **Concurrency is the task's.** `load.concurrency` is how many exchanges are
  in flight, on that many lanes. A lane performs an exchange, waits for all
  of its result, and only then starts its next one. In a round of `count`
  exchanges, lane `w` performs exchanges `w`, `w + lanes`, `w + 2·lanes`, …
  and exchange `k` uses fixture `k mod fixtures`; `warmup` and
  `requestsPerRound` are multiples of the number of fixtures, so every round
  of every adapter sends the same requests. How a lane runs is the
  language's: an asynchronous loop on the one event loop (JavaScript), a
  thread (a blocking client in Python, Ruby or Rust), a goroutine (Go), a
  task on the Tokio runtime the adapter builds (an asynchronous Rust client).
  The harness's runner owns the lanes; an adapter never starts its own.
- **Keep-alive or new connections is the task's too**, and it is checked. The
  peer counts the connections it accepts. With `"keepAlive": true` in the
  peer's script a client may open at most `load.connections` connections in
  the whole run, the verification and warm-up included (default: twice the
  concurrency, because a pool may open a spare when a lane's next request is
  issued before the connection of its last response is back in the pool:
  Node's `fetch` settles at two per lane, hyper's pool at one or two spares). With
  `"keepAlive": false` the peer closes after every response and the client
  must have opened exactly one connection per exchange. A pool that takes a
  size is given the number of lanes.
- **What is timed**: the round, inside the adapter's process, from starting
  the lanes to the last result. CPU time is user plus system on all threads
  of that process (`process.cpuUsage()`, `getrusage`, the process CPU clock),
  so a client that works on several threads is charged for all of them. Time
  spent waiting for the peer is not CPU time. Connecting, the checks,
  messages to the harness and forced collection are outside it. A run is a
  warm-up of `load.warmup` exchanges, a rehearsal of `load.rounds` rounds in
  the same process, then `load.rounds` measured rounds of
  `load.requestsPerRound`; the figure is the median of rounds, then of runs.
  Memory is the footprint after the last round above the runtime's idle
  process, as for servers.
- **Verification, from both ends.** Before anything is measured the adapter
  performs one exchange per fixture, in order, on one lane, and hands back
  what it got: that must be the task's expected results (`verifyResults` in
  the scenario, or equality with each fixture's `expected`). The peer must
  have recorded exactly one accepted request for each of those exchanges and
  no refusal. After the warm-up and after every round, rehearsal included,
  the peer's record is compared again with what the round should have sent:
  the exact count per scripted exchange, nothing refused. So a client that
  sends something else, sends nothing, or sends too much fails
  (`harness/tests/client.test.mjs` tries each).
- **A slow peer would hide differences**, because a client that waits looks
  no worse than one that does not, and fewer responses arrive per turn of an
  event loop. So the peer must never be what a client waits for. The HTTP
  peer keeps one thread per connection and answers from prepared bytes, and
  every measured round records the CPU time the peer used (`peerCpuMs`).
  `node scripts/peer-ceiling.mjs <category>/<task>` shows the check: how fast
  the peer answers a client that does nothing but write a prepared request
  and count the response's bytes, beside the rate each stored result reached
  and how busy the peer was. On the machine
  of the first results (8 lanes, a machine that was not idle) the HTTP peer
  answered 98,000 requests a second to such a client, for 15 µs of its own
  CPU per request, and that bare client used 15 µs too: what bounds the rate
  is the two thread wake-ups of a loopback round trip, not the peer's work.
  The fastest entry (Bun's `fetch`) reached 84 % of that rate, with the peer
  busy 16 % of its lanes' time; the slowest reached 10 %, with the peer busy
  2 %. So no entry waited for the peer to work; all of them wait for the
  round trip, which is the same for all and is not CPU time.
  The Redis stand-in is nearer its limit with a client that sends all its
  lanes' commands down one connection, because one connection is one thread
  of the peer: in the first results that thread was busy 20 % of the time
  with node-redis and 57 to 69 % with ioredis and Bun's client (1.4 and
  3.5 µs of peer CPU per command, nearly all of it the system's read and
  write). It kept ahead of every client, and a real Redis, which is also one
  thread, would be slower; but how many replies reach such a client per turn
  of its loop depends on the peer's speed, so its figures are tied to this
  peer more than the HTTP figures are. Look at `peerCpuMs` over `wallMs` in
  the raw rounds before trusting a new task of this shape.

### Files

The driver is `harness/client.mjs` (`measureClient`), with one runner per
language: `harness/js/client-runner.mjs`, `harness/python/client-runner.py`,
`harness/ruby/client-runner.rb`, `harness/go/client-runner.go` and
`harness/rust/src/client.rs` (`bench_harness::client`). Peers are binaries of
the harness crate: `harness/rust/src/bin/<program>-peer.rs`, with what they
share in `harness/rust/src/peer.rs`. `scripts/lib/client-tasks.mjs` is what
`scripts/measure.mjs` needs to run the kind. A client task owns its runners;
it does not use the runners of the asynchronous operation kind. The two could
share later: the lane loop of the JavaScript runner and of `run_tokio` is the
same as "N awaited operations in flight", and the client kind could become
"an asynchronous operation with a peer" if the fixed-count rounds and the
peer checks after each round were added there. They differ on purpose in one
thing: an asynchronous operation task fixes the number of threads
(`load.threads`), a client task leaves a client its default threads and
counts them all.

### Peers that exist

| `peer.program` | Protocol | Script |
| --- | --- | --- |
| `http` | HTTP/1.1 origin, plain TCP | `{ keepAlive, routes: [{ method, path, requestBody?, requestContentType?, status, contentType, body }] }` |
| `redis` | A stand-in for a Redis server: RESP2, and RESP3 after `HELLO 3` | `{ commands: [{ request: ["GET", "key"], reply: "$5\r\nvalue\r\n", reply3? }] }` |

The HTTP peer accepts a request only if all of this holds; otherwise it
answers `400`, records the refusal with its reason and closes the connection:
the request line is `METHOD SP path SP HTTP/1.1` and names a route (method
and path, compared exactly, query string included); every header line is
`name: value`; there is exactly one `Host` header and it is
`127.0.0.1:<port>`; there is no `Transfer-Encoding` and no `Expect`; a route
with a `requestBody` gets a `Content-Length` equal to its length in bytes,
exactly those bytes, and a `Content-Type` that starts with
`requestContentType` if the route names one; a route without one gets no
body. A connection that ends inside a request is a refusal as well. A
request that says `Connection: close` is answered and the connection closed,
which a keep-alive task then counts against the client. It answers `HTTP/1.1 <status>`, `Content-Type`, `Content-Length` and the body in
one write. It does not speak TLS, HTTP/2, chunked bodies, compression,
redirects or cookies: a task about one of those needs the peer extended
first, which is harness work, not adapter work.

The Redis stand-in is not a database: it answers each scripted command with
its scripted reply, whatever was sent before. A command is accepted only as a
RESP array of bulk strings equal, byte for byte, to a scripted command (the
command's name in any case); anything else gets `-ERR`, is recorded as
refused, and the connection is closed. Pipelined commands are answered in
order, in one write. What clients send when they connect is answered and not
counted, and is all that is accepted besides the script: `HELLO` (2 or 3,
without AUTH), `CLIENT SETINFO`, `CLIENT SETNAME`, `PING`, `SELECT 0`, `INFO`,
`QUIT`; any other `CLIENT` subcommand gets the error Redis 7.0 gives one it
does not know (node-redis probes with one). It fits tasks whose commands have
replies that do not depend on earlier commands of the run: GET, SET, MGET,
HGETALL, a pipeline of those. It does not fit transactions, scripts, blocking
pops, pub/sub or anything else that needs a server's state: those need a real
server (below). An operation that sends several commands (a pipeline) names
them in its fixture as `exchange: [i, j, …]`.

A peer is one file, `harness/rust/src/bin/<program>-peer.rs`, plus a `[[bin]]`
entry in `harness/rust/Cargo.toml`: it reads its script with `peer::script()`,
keeps a `peer::Record` with one counter per scripted exchange, and hands
`peer::listen` a function that serves one connection. It must call
`record.accepted(i)` before the reply leaves and `record.refused(reason)` for
everything outside the script, and it gets a test in
`harness/tests/client-peer.test.mjs` that sends it wrong bytes.

### Writing a client task (only files under `benchmarks/<category>/`)

1. Read `benchmarks/http-client/get-json/` in full; copy its layout.
2. `category.json` once per category: `title`, `summary`, and `taxonomy` (the
   category's id in `data/taxonomy.json`).
3. `task.json`: `"kind": "client"`, and in `load`: `concurrency`, optionally
   `connections`, `warmup`, `rounds` (3), `requestsPerRound`. Both counts are
   multiples of the number of fixtures. Choose `requestsPerRound` so that the
   slowest adapter's round takes under ten seconds (a phase times out at
   thirty). `metrics` as in the example (`cpuPerRequestUs`). `fixtureCount`
   is the number of fixtures. `notes` says in one or two sentences that the
   server is the harness's and what the task fixes.
4. `scenario.mjs` exports `peer = { program, script }` (a peer from the table
   above; the script is plain JSON) and `cases`, a list of
   `{ input, expected }`. Fixture `i` performs exchange `i` of the script
   (route `i` for the HTTP peer); if several fixtures use one exchange, or
   the order differs, give each fixture `exchange: <index>`. `input` is what
   the adapter needs to ask (a path, a body as the exact text to send),
   `expected` is the value a correct exchange returns, as plain JSON. A body
   to send is prepared text in the fixture, the same bytes for every
   adapter, because the peer compares bytes; serializing it is not the
   client's work in these tasks. Export `verifyResults(outputs)` only if
   equality with `expected` is not the right check.
5. `task.md`: what one operation is, what the peer answers, what the task
   fixes (in flight, keep-alive or new connections, what is not used: TLS,
   retries, redirects), what a correct exchange is, and what adapters may
   configure.
6. One folder per adapter, with an `adapter.json` as elsewhere (`author`,
   `review: "unreviewed"`, `notes`; `title`, `language` and `runtimes` for a
   built-in). The note says what the adapter configured that is not the
   default and why (almost always: what keep-alive needs).

   **JavaScript** (`npm/<package>/adapter.js`, `jsr/@scope/name/adapter.js`,
   `builtin/<name>/adapter.js`; runs on Node, Bun and Deno unless `runtimes`
   narrows it):

   ```js
   import { Agent, request } from 'undici'
   let origin, dispatcher
   // Once, before anything is measured. peer = { host: '127.0.0.1', port,
   // origin: 'http://127.0.0.1:<port>', concurrency, connections }
   export function connect(peer) {
     origin = peer.origin
     dispatcher = new Agent({ connections: peer.concurrency })
   }
   // One exchange. Returns (a promise of) what the library gives back.
   export async function operation(input) {
     const { statusCode, body } = await request(origin + input.path, { dispatcher })
     if (statusCode !== 200) throw new Error(`status ${statusCode}`)
     return body.json()
   }
   // Optional: describe(result) turns a result that is not plain JSON into
   // JSON for the verifier (outside timing); close() runs once at the end.
   ```

   **Rust** (`cargo/<crate>/Cargo.toml` and `src/main.rs`; the package name
   is `<category>-<task>-<crate>`; depend on
   `bench-harness = { path = "../../../../../harness/rust", features = ["client"] }`,
   or `"client-tokio"` for an asynchronous client). A blocking client calls
   `bench_harness::client::run_blocking(connect, operation, consume, describe)`:
   `connect(&Peer) -> S` once per lane, `operation(&mut S, &Value) -> Result<T, E>`
   one exchange, `consume(&T) -> u32` something cheap read from the result
   inside the round, `describe(&T) -> Value` the result as JSON for the
   verifier. An asynchronous client builds its Tokio runtime and calls
   `run_tokio(runtime, connect, operation, consume, describe)`, where
   `connect(&Peer) -> C` returns the client all lanes share and `operation`
   is an `async fn(&'static C, &'static Value) -> Result<T, E>`. Use the
   runtime `#[tokio::main]` would build
   (`Builder::new_multi_thread().enable_all()`) and say so in the note; a
   one-thread variant is a second adapter with `"package": "<crate>"`, a
   title and the tag `non-default-options`, as for the servers. Copy
   `cargo/ureq` or `cargo/reqwest` of the example. After adding a crate, run
   `node scripts/lock-crates.mjs` at the repository root: it adds the new
   crate and what it needs to Cargo.lock, changes no other pin, downloads no
   source, and steps back any release under seven days old. Run no cargo
   command yourself.

   **Python and Ruby** (`builtin/<name>/adapter.py` or `.rb` for the standard
   library, with `"language"` and `"runtimes"` in adapter.json;
   `pypi/<name>/` or `rubygems/<name>/` for a package, named and installed as
   in "Adapters for PyPI, RubyGems and Go modules" above: the scripts choose
   the version, write `lock.json` beside the adapter and install from it):
   define `connect(host, port)`, which returns one lane's own state (a
   connection, a session), and `operation(state, input)`; optionally
   `describe(result)`. Each lane is a thread that lives for the whole run,
   calls `connect` itself and keeps its state, so a client that keeps a
   connection per thread keeps it. These runners are for blocking clients;
   an `async def` operation is not run yet.

   **Go, standard library** (`builtin/<name>/adapter.go`, `package main`):
   `func connect(host string, port int, lanes int)` once, and
   `func operation(input any) any`, called from `lanes` goroutines.

   Go modules are not run by client tasks yet (see "Not there yet" below).
7. Every adapter fails an exchange that did not succeed (a status that is not
   the scripted one, an error reply), in its library's own way, and returns
   the value the task names. It does not cache, batch, pipeline or retry
   unless the task says so, and does not start threads or concurrent
   requests of its own.
8. `node scripts/measure.mjs <category>/<task> --check` until every adapter
   says `works`. `the peer refused …` quotes the peer's reason for the first
   request it refused; `the peer did not receive what the task sends` means
   requests were missing or extra; `the client opened N connections` means
   the client does not reuse connections (find its keep-alive setting).
   Do not measure; say in your report that the task is ready to measure.

### Peers that are real server software

A stub peer is a fair stand-in when the client's work in the task (encode a
request, read and decode a reply) does not depend on what the server does to
produce the reply, and when the client does not negotiate features with the
server that a stub would have to imitate. Then a stub is better than the
real thing: it is identical for every adapter, costs nothing to install, and
cannot be slow. Where that does not hold, the real server is needed, under
the project's rules: a pinned version at least seven days old, its files
checked against a recorded SHA-256, no install scripts and no package
manager's hooks, unpacked under `.cache/servers/<name>-<version>/`, never
installed system-wide, started by the harness on `127.0.0.1` with a
throw-away data directory under the run's temporary folder, and stopped by
the harness (the same `startPeer`/`stop` path as a stub, so it cannot be left
running). None of that is built; this is the plan.

| Peer | A scripted stub? | If the real server is needed |
| --- | --- | --- |
| Redis | **Yes, built** (`redis-peer.rs`, 200 lines) for commands whose replies do not depend on state. Clients differ in what they send on connecting, and the stub answers a fixed list of those; a client that needs more fails visibly and the list is extended in the peer, never per adapter. | For stateful tasks and for the job queues that sit on Redis. Redis and Valkey publish no macOS binaries, so the server would be built from a pinned source archive (SHA-256 recorded) with its own Makefile under `.cache/servers/`: compiling the server's C code is the one step that runs code from the download, as a gem's native extension does. Started as `valkey-server --bind 127.0.0.1 --port <p> --save "" --appendonly no --dir <tmp>`. |
| SMTP server | **Yes, small** (about 200 lines, not built). SMTP is a line protocol: greeting, `EHLO` with a fixed capability list (no STARTTLS, no AUTH), `MAIL FROM`, `RCPT TO`, `DATA`, `RSET`, `QUIT`. The task hands every client the same prepared RFC 5322 message as raw bytes, so the sink can compare the envelope and, after undoing dot-stuffing, every byte of the message. | Not needed. |
| WebSocket echo | **Yes, small** (about 250 lines with SHA-1 and base64 by hand, not built): the HTTP upgrade with the right `Sec-WebSocket-Accept`, then masked client frames checked against the script and echoed unmasked; no `permessage-deflate` offered. | Not needed. |
| SOCKS5 proxy | **Yes, small** (about 200 lines, not built): no-auth negotiation and `CONNECT` to the scripted destination only, after which the same program plays the destination (a fixed reply). A task that opens a connection per operation must keep its total under the system's ephemeral ports (about 16,000 on macOS, reusable after 30 s). | Not needed. |
| PostgreSQL | **Feasible for one narrow task, large** (600 to 900 lines, not built): start-up with trust authentication, the parameter statuses drivers read, then simple and extended query (Parse, Bind, Describe, Execute, Sync) answered with fixed rows in the text or binary format the client asked for. Fair for "run a prepared SELECT and decode its rows" and "INSERT with parameters", with built-in types only. It cannot be byte-strict: drivers name statements, describe, batch and set session parameters differently, so it would match the SQL text and parameter values. Drivers that look types up in `pg_type` or open with `SET`/`SHOW` queries would each add scripted answers. | Probably the better first step. Pinned binaries, no install script: the EDB binary archives for macOS, or the per-platform packages the `embedded-postgres` project publishes on npm, which the project's own npm path could install with the age rule and scripts off (its symlinks are made by an install script, so the harness would have to make them; not verified). `initdb -A trust --no-sync` into the run's temporary folder, then `postgres -c listen_addresses=127.0.0.1 -c unix_socket_directories= -c fsync=off -p <p>`, stopped with SIGTERM then SIGKILL. The server's CPU is outside the client's process as with any peer, but a real server can be the bottleneck and its rate must be checked as for the HTTP peer. |
| MySQL | **Not recommended** (700 to 1,000 lines): the handshake negotiates capability flags that change the framing of every later packet, and authentication plugins (8.x defaults to `caching_sha2_password`, which needs RSA or TLS); text and binary result sets are separate encodings. | Oracle publishes macOS and Linux tar archives of MySQL Community Server; pinned by version with the SHA-256 recorded at first download and checked after. `mysqld --initialize-insecure --datadir=<tmp>`, then `mysqld --bind-address=127.0.0.1 --port=<p> --mysqlx=OFF --socket=<tmp>/sock`. A download of several hundred MB. |
| MongoDB | **No.** Drivers do more than send a command and read a reply: server discovery and monitoring (`hello` on separate connections, streamed with a topology version), sessions, cursors with `getMore`, and every command and reply is BSON with fields the driver adds. A stub would be a partial server that each driver trips differently. | MongoDB publishes tar archives for macOS and Linux with `.sha256` files: unpack, `mongod --dbpath <tmp> --bind_ip 127.0.0.1 --port <p> --nounixsocket`. SSPL-licensed; used locally, not redistributed. |
| Kafka | **No.** Every client negotiates its own version of some forty APIs, and produce, fetch and the group protocol are large. | Apache Kafka in KRaft mode, one node. It needs a JVM, which is a second pinned download (an Eclipse Temurin archive with its SHA-256) beside the Kafka archive (SHA-512 published). Redpanda has no macOS build. Slow to start, several hundred MB of memory. The heaviest peer on this list, and the brief has no npm or Rust package: last in line. |
| SSH server | **No**: the transport is real cryptography (key exchange, host key, an AEAD cipher), so a "stub" is an SSH server. | Two ways. (a) A peer built in the harness crate on the `russh` crate, pinned by Cargo.lock under the age rule like any crate: an `exec` handler with fixed output and an SFTP subsystem, a few hundred lines. Preferred: portable and pinned. (b) The system's OpenSSH `sshd`, run unprivileged with its own config (`ListenAddress 127.0.0.1`, a port the harness picks, a host key and one authorized key made for the run, `PasswordAuthentication no`, a `ForceCommand`), with its version recorded like the system Python's (`expectedVersion`). Either way the server's config must fix one key exchange, one host key type and one cipher, so every client does the same cryptography; a client that lacks them fails visibly. |

### Verdicts for the categories that need a peer

| Category | Verdict |
| --- | --- |
| `http-client` | **Ready for the fan-out.** Two tasks exist (`get-json`, `post-json`) on the `http` peer. More adapters: npm gaxios, superagent, needle, the JSR clients; PyPI httpx (its blocking client), httplib2; RubyGems httparty, httpclient, faraday with a persistent adapter; crates isahc, attohttpc. More tasks need no harness work while they stay within what the peer speaks (a large body, many headers, a new connection per request with `keepAlive: false` and small rounds). |
| `redis-client` | **Ready for the fan-out** for stateless commands, on the `redis` stub (`get-set` exists). PyPI `redis` and RubyGems `redis`, `redis-client` can be added now; Go's clients wait for Go modules in client tasks. Stateful tasks need the real server. |
| `websocket-messaging` | **Needs a stub peer** (about 250 lines), then ready: built-in `WebSocket` on the three JavaScript runtimes, npm ws, crates tungstenite and tokio-tungstenite, PyPI websockets and websocket-client. One lane per connection: send a message, wait for its echo. The in-memory codec idea in the backlog is a different, synchronous task. |
| `smtp-client` | **Needs a stub peer** (about 200 lines), then ready: Python `smtplib` and Go `net/smtp` built in, npm nodemailer, RubyGems net-smtp, crate lettre. |
| `socks-proxy-client` | **Needs a stub peer** (about 200 lines). Few packages (npm socks and socks-proxy-agent, PyPI pysocks, RubyGems socksify, Go modules); low priority. |
| `grpc-rpc` | **Needs a stub peer of another kind**: HTTP/2 is too large to write by hand, so the peer would be built on the `h2` crate (already locked, through hyper) and answer one unary method with prepared protobuf bytes, comparing the request bytes with the script (about 300 lines). Also needs a decision on generated code: check the generated stubs in beside each adapter, so no `protoc` is installed. The brief's packages are tonic, grpcio, grpclib; `@grpc/grpc-js` would be the npm entry. |
| `postgres-client` | **Needs real server software** (or the large stub above for one narrow task). See the table. |
| `mysql-client` | **Needs real server software.** No npm package in the brief; mysql2 and mariadb would be chosen. |
| `mongodb-client` | **Needs real server software.** A synchronous BSON encode/decode task fits the existing synchronous kind and needs none of this. |
| `kafka-client` | **Needs real server software** and a JVM. Last in line. |
| `ssh-client` | **Needs real server software**, best as a peer on the `russh` crate. Every package in the brief is on PyPI, RubyGems or Go. |
| `background-job-queues` | **Needs real server software, and is not a client task.** celery, huey, kombu, sidekiq and resque need a real Redis (lists, blocking pops, scripts: state a stub cannot fake), delayed_job a SQL database. What is measured is a worker draining a queue, in one or several processes, which is nearer the asynchronous operation kind with a server beside it. The packages also promise different things (retries, scheduling, acknowledgement), so "the same job" needs care. Low priority; possibly not comparable. |
| `object-relational-mapping` | **Fits an existing kind, not this one.** With SQLite in memory there is no peer and no network: a synchronous task with PyPI adapters (SQLAlchemy, peewee, SQLModel over the standard library's `sqlite3`) and Go modules (gorm with a pure-Go SQLite driver). It belongs to the work on PyPI and Go adapters. Against PostgreSQL it would need that peer. |
| `http-application-servers` | **Fits the existing `http-server` kind, not this one.** uvicorn and puma already run in `http-server/json-api` through `scripts/lib/native-http.mjs`; a task with a bare callback would add webrick, thin, actix-http and hyper the same way. gunicorn and unicorn fork worker processes, and the supervisor measures one process: they need CPU and memory summed over a process tree first. |

### Not there yet

- **Go modules** in client tasks. `scripts/lib/native-packages.mjs` builds a
  Go module adapter with the synchronous runner; it needs the runner as a
  parameter, then `prepareNativeClient` in `scripts/lib/client-tasks.mjs` can
  use it as it uses PyPI and RubyGems.
- **Asynchronous Python clients** (aiohttp, httpx's AsyncClient, asyncpg):
  `harness/python/client-runner.py` runs a lane as a thread. An asyncio mode
  (lanes as tasks on one loop when `operation` is a coroutine function) is
  about thirty lines there.
- **Type-check cost of Python, Ruby and Go client adapters.**
  `scripts/measure-native-checks.mjs` wraps an adapter as `operation(input)`;
  a client adapter's `connect` and `operation(state, input)` need their own
  wrapper in `scripts/lib/native-wrappers.mjs`. Until then
  `harness/tests/native-checkers.test.mjs` lists them as unchecked.
- **TLS, HTTP/2, chunked and compressed bodies** in the HTTP peer.
- **One-thread variants** of the asynchronous Rust clients, as the servers
  have.
- **Peers for WebSocket, SMTP, SOCKS and gRPC**, and every real server above.

## Reviews

Every adapter starts as `"review": "unreviewed"`. Readers ask for a review, or
give one, through the issue forms in `.github/ISSUE_TEMPLATE/`; the buttons on
the site open them filled in. When a review is accepted, record it in the
adapter's `adapter.json`:

```json
"review": "maintainer",
"reviewed": { "by": "their-github-name", "date": "2026-10-06", "issue": "https://github.com/…/issues/12" }
```

- `"maintainer"`: a maintainer of the package read the adapter and agrees that
  it uses the package correctly. Confirm that the account is a maintainer (its
  commits in the package's repository, or its registry page) before recording
  it. Shown as a blue check.
- `"human"`: a person other than the adapter's author read it and found it
  correct. Shown as a grey reviewer mark.

A review is of the adapter as it was then: when an adapter changes in a way
that matters, set it back to `"unreviewed"`. Another version of a package
under `versions` in `adapter.json` has its own `review`.


## Adapter notes

In `adapter.json`, `notes` is shared across runtimes. Optional `runtimeNotes`
adds a note keyed by runtime ID (`node`, `bun`, `deno`, or `rust`):

```json
{
  "notes": "Shared context for every runtime.",
  "runtimeNotes": {
    "node": "Uses a Node-specific adapter.",
    "bun": "Uses the native server API."
  }
}
```

Label footers show the shared note first, followed by the current runtime's
note, with automatic wrapping and height. Either field may be omitted. Other
runtimes' notes are never included on that label. Package adapter details list
shared notes and label each applicable runtime note by runtime name. Run
`npm run build` to update inline cards and downloadable SVGs; measurements do
not need to be rerun.

## Cross-language edition (harness 2)

Run `node scripts/setup-native.mjs` to restore the pinned PyPy download locally.
The other native binaries must match the paths/versions in `runtimes.json`.

The suite now includes standard-library adapters for Go, CPython, PyPy, CRuby
and CRuby with YJIT. `runtimes.json` records exact required native runtime
versions and interpreter/JIT flags. The built-in rows describe specific APIs,
not blanket language rankings. Only the current fixtures define equivalence:
Python/Ruby equality, for example, has different numeric semantics outside the
JSON-compatible corpus. Ruby's sorted JSON adapter recursively copies/sorts
on every call; Go and Python include their own sorting in serialization.

Every process, including native compiled implementations, executes its initial
short warm-up followed by one full rehearsal of the measured round schedule.
Only subsequent rounds are scored. This happens in the SAME process: warming
one process and measuring a fresh process would discard JIT state. The extra
run does not prove complete JIT convergence; its rounds are retained as
`warmupRounds` for inspection. HTTP servers follow the same full-rehearsal
policy. Cached results from an older harness are automatically refreshed.
`npm run measure-all` runs all tasks sequentially.

Memory is the process's physical footprint: what it has written to and still
holds (macOS `phys_footprint`, the figure Activity Monitor shows; on Linux the
anonymous and shared-memory part of the resident size). Resident size is
recorded too but not graded: it also counts the runtime's own binary, and on
macOS pages a runtime has already released that the system has not yet taken
back, which made runtimes that free eagerly look as if they held their
high-water mark.

Each raw result embeds its baseline, preventing a later baseline refresh from
changing its interpretation. For operation tasks that is a warm baseline: the
same runtime running the harness over the task's own fixtures and rounds with
a do-nothing adapter, measured once per task and runtime
(`results/_baseline/<task>/<runtime>.json`). What a runtime holds after that
(its warmed-up machinery, the fixtures, the harness) is not the package's.
Server tasks still use the runtime's idle process. Package memory grades use
the footprint after the final task round and settled GC, above that baseline.
Runtime comparison labels and tables instead use the total footprint after
the task, including the runtime itself. Lifetime peak RSS remains an ungraded
diagnostic: it includes startup and warm-up and is not a task-only peak. The
footprint after GC includes retained allocator pages and JIT code, not only
live objects. We do not claim to measure peak task demand.
The detailed table shows both. `memoryAboveBaselineMb` retains the signed
incremental difference, while negative package deltas are clamped for grading.
`heapAboveBaselineKb` is an additional ungraded
settled-heap delta; subtracting a baseline does not make different heap
accounting systems equivalent. JS includes heap and external allocations;
Rust counts requested live allocator bytes; Go uses HeapAlloc; Ruby uses
ObjectSpace.memsize_of_all; PyPy uses GC bytes (the pinned runtime's raw stats).
CPython's field is unavailable: allocation tracing would distort its timed CPU
work. None of these should be presented as universally exact process memory.

Type-check cost is added process CPU seconds × added memory MB, in MB·s.
Each of its class boundaries is the CPU boundary times the memory boundary.
Memory has its own scale (1.5, 2.5, 4, 6.5, 10, 16 times the best) because
memory results sit closer together than CPU results (1.5, 3, 6, 12, 25, 50).
User + system CPU already accounts for work across threads, so there is NO
additional thread-count multiplier. Elapsed time is retained separately.
Refresh existing compiler measurements with `node scripts/refresh-checks.mjs`.
The CPU score uses a 10 ms floor for timing/baseline noise; negative deltas
are clamped to zero for grading. TypeScript and Rust have separate anchors.

Native type checkers are pinned in `toolchains/checkers.json` and
`toolchains/checkers-requirements.txt`. Run `node scripts/setup-checkers.mjs`,
then `node scripts/measure-native-checks.mjs`. The latter performs eleven
fresh-process runs of each adapter and an empty baseline, recording process
CPU (user + system), elapsed time, and checker peak RSS through `wait4`.
This memory measure is not the runtime benchmark's settled RSS or the
TypeScript compiler's reported heap; each checker has separate grade anchors.

- Python: mypy strict, targeting Python 3.12, with bundled typeshed. It checks
  the actual adapter body with generated parameter/return annotations and a
  recursive JSON alias, with all incremental caching disabled. The same
  measurement applies to CPython and PyPy; mypy itself runs under CPython.
  HTTP adapters carry their own annotations and load the installed framework
  types. Waitress uses a small local API stub; WSGI/ASGI payload values remain
  dynamic, so these checks do not prove request-body shapes.
- Ruby: native Sorbet checks the actual bodies with generated method signatures,
  bundled core/JSON RBI, and the checked-in CGI signature. Nested JSON contents
  remain `T.untyped`; this is partial static coverage, not a claim of full typing.
  Results apply to both CRuby configurations, independently of YJIT. HTTP
  checks cover the adapter with a local Roda boundary RBI; routing DSL values,
  Rack input and parsed JSON remain dynamic. Puma itself is not type-checked.
- Go: a `go/types` driver parses and checks the actual adapter and loads prepared
  standard-library and framework export data. Export preparation, compilation and linking
  are outside the measured process; import loading is included.

Each checker must reject a deliberately invalid return type before measurements
are accepted. Raw runs, source hashes, baselines and checker versions live in
`data/native-checks.json`. Small positive/negative deltas are measurement noise;
negative deltas clamp to zero and scoring uses the existing 10 ms CPU floor.

## Registry identity and JSR

Use a package's official distribution source. JSR packages live under
`jsr/@scope/name`, keep their canonical names and JSR links, and are pinned in
`versions.json` under `jsr`. Their npm-compatible bridge is used to install the
same published module artifact for Node, Bun and Deno; this does not create a
second npm package entry. Downloads and transpilation occur before measurement.
The same seven-day release gate and disabled install scripts apply, including
transitive dependencies. Lockfiles remain in each adapter's isolated workdir.

The first JSR entries are `@std/html` (HTML escaping), `@std/assert` (boolean
`equal`, not throwing assertions), and `@oak/oak` (HTTP). All use the existing
shared fixtures and correctness checks. TypeScript checker measurements load
these same canonical package aliases at the pinned JSR versions.

## Best and All views

A language's Best tab chooses each package's runtime by the active ranking on
task pages. Other columns retain that same runtime's measurements. The package
index chooses by CPU, preferring candidates with the greatest measured task
coverage before comparing class and relative cost. All combines packages from
all languages, always uses Best, and includes language and runtime columns.
These are views over existing measurements; they do not add duplicate entries
to the underlying data or affect anchors. Type-check grades remain checker-specific.


## Native HTTP servers and the Elysia beta

`node scripts/setup-http-servers.mjs` restores the pinned Python, Ruby and Go
HTTP dependencies into workspace caches. PyPI packages use binary wheels;
Ruby gems are SHA-256 checked and their native extensions built locally.
Go modules retain `go.mod`/`go.sum` per adapter and checksum-database validation.
All selected releases and Go dependencies pass the seven-day age gate.
`toolchains/http-servers.json` records exact pins. Run the HTTP task with
`--only=uvicorn,starlette,waitress,puma,roda,go-net-http,chi,gin`.

Elysia 2 beta uses the existing Elysia version history: run
`node scripts/measure.mjs http-server/json-api --only=elysia --version=2.0.0-beta.19`.
Stable 1.4 remains the pinned ranked version. The beta and its dependencies
follow the same seven-day release-age rule.
Per-version adapter notes record its Node adapter incompatibility.

TypeScript projects and their empty baseline load the same pinned
`@types/node`, `@types/bun` and `@types/deno`. This is a common ambient-type
baseline, not a measurement of `deno check` or a runtime-specific application.
`skipLibCheck` stays enabled: this measures declaration loading, not full
checking of dependency implementation bodies. Runtime type pins are retained
in `data/types.json`; changing them invalidates all cached package checks.


## Parallel release lines

The existing `versions.json` registry maps still select one default full release
per package. Optional `activeVersions` marks additional exact full releases for
ranking, for example `{"npm":{"express":["4.22.3"]}}` alongside a default Express
5 pin. Only enable a line after benchmarking it with the current harness.
This is configuration support; historical Express 4 has not been promoted.
Prereleases are rejected in `activeVersions` and remain version-history results.

Active lines share one canonical package page and catalog identity, but receive
separate version rows, scores, labels and version links. The unversioned package
URL opens the default full release. `--version` alone never promotes a release.
TypeScript checks accept `--version` too and keep version-specific measurements.


## Priority

The measuring scripts ask for a higher priority than other work on the
machine (`nice -15`), so that background activity disturbs a measurement
less. The processes they start take that priority. Raising a priority needs
root. Either run as root, or let your user run `renice` without a password:

```
sudo visudo -f /etc/sudoers.d/renice
# add this line, with your user name:
# yourname ALL=(root) NOPASSWD: /usr/bin/renice
```

Without it the scripts print one line that says the priority was not raised,
and measure as before. `BENCH_PRIORITY=-10` sets another value; `0` turns it
off.

## Running things

| Command | What it does |
| --- | --- |
| `npm run setup` | Gets a machine ready: installs the pinned tools and packages under the seven-day rule, and says which language toolchains are missing. Safe to run again. |
| `npm run status` | Reports what is measured and what is not, without measuring: missing adapters, failures, results from an older harness, adapters changed since they were measured, packages without a type check. |
| `npm run refresh` | Runs everything in order: setup, every task, the type checks, the site build, the tests. Stops at the first failure. `--only=measure,build` and `--skip=setup` choose steps; other flags (`--force`, `--reps=5`, `--runtimes=node,bun`, `--tasks=…`) go to the measurements. |
| `npm run measure-all` | Measures every task found under `benchmarks/`, one after another. |
| `npm run measure -- <category>/<task>` | Measures one task. |
| `npm run measure-checks` | Re-measures the type checks: TypeScript, `cargo check` and the native checkers. |
| `npm run build` | Builds the site into `dist/`. `npm run preview` serves it on port 4173. |
| `npm test` | Runs the harness and site tests. |
| `npm run update-popularity` | Refreshes downloads, versions and ranks of the listed packages. |

Everything graded is CPU time, so measure on an otherwise idle machine.
With `--incremental` the type-check step measures only what has no result
yet, instead of every package again (which takes over an hour). `--retry-failed`
measures failed results again.

`npm run refresh` refuses to start while another measurement is running or the
machine is busy, unless given `--anyway`. Measurements already on disk are kept
and skipped unless `--force` is given, so an interrupted run can be resumed.

### What is measured again

A result is kept and skipped on the next run only while everything it depended
on is unchanged. Entries in a task are graded against each other, so when any
of the following changes, the whole task is measured again, not just the part
that changed: the harness, the task's load settings or fixtures, the source of
any adapter in the task, the version of any runtime or toolchain, the machine,
or the pinned version of any package the task uses. The run says why, for
example `measuring again: an adapter in the task changed`. A result that
failed (a crash or a timeout) is kept as failed; pass `--retry-failed` to try
those again.

Two flags override this. `--force` measures everything again, whatever is
already there. `--keep-existing` does the reverse: it keeps every result that
is already there and measures only what is missing, without checking whether
anything changed. Use it to finish a run without redoing work, knowing that
kept results may no longer match the code.
