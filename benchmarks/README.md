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

After 10,000 initial calls and a full three-round unmeasured rehearsal, each of three measured rounds runs batches of 100,000 calls
until at least 250 ms has elapsed. Counts are recorded per round, so costs use
the actual count rather than assuming every adapter did equal work. CPU is child
user plus system CPU from `process.cpuUsage()`. GC can occur naturally inside a
batch; forced settled GC runs outside timing. Heap includes external memory.
Peak RSS covers the whole process, including fixture construction and validation;
it is not solely package allocation. No individual-call latency is measured.

The site reports the median of round costs, then the median across fresh
processes. These are repeated, cache-hot microbenchmarks of deliberately narrow
contracts; they do not rank a library's entire API. Tiny differences and memory
near the 4 MiB grading floor should not be over-interpreted. CPU grading uses
four decimal places for microsecond operation costs to avoid zero anchors.

New adapter versions use the existing seven-day release-age filter, disabled
install scripts, and shared `versions.json`. Raw results include runtime and
machine versions. Adapter metadata records authorship and unreviewed status.


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

Each raw result embeds its empty-process baseline, preventing a later baseline
refresh from changing its interpretation. Package memory grades use RSS after the final task round and settled GC
above the settled empty-process baseline. Runtime comparison
labels and tables instead use total after-task RSS, including the runtime itself.
Lifetime peak RSS remains an ungraded diagnostic: it includes startup and warm-up
and is not a task-only peak. After-GC RSS includes retained allocator pages and
JIT code, not only live objects. We do not claim to measure peak task demand.
The detailed table shows both. `memoryAboveBaselineMb` retains the signed
incremental difference, while negative package deltas are clamped for grading.
`heapAboveBaselineKb` is an additional ungraded
settled-heap delta; subtracting a baseline does not make different heap
accounting systems equivalent. JS includes heap and external allocations;
Rust counts requested live allocator bytes; Go uses HeapAlloc; Ruby uses
ObjectSpace.memsize_of_all; PyPy uses GC bytes (the pinned runtime's raw stats).
CPython's field is unavailable: allocation tracing would distort its timed CPU
work. None of these should be presented as universally exact process memory.

Type-check scoring uses sqrt(added process CPU milliseconds × added memory MB).
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
