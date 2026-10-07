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
