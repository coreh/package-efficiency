# Log records as JSON lines

One operation is given a list of records and logs each one with the library,
as one JSON object per line, to an in-memory sink. It returns what the sink
captured. A record is `{ level, message, fields }`: `level` is `info`, `warn`
or `error`, and `fields` always has the same five keys, `user_id` (integer),
`route` (string), `duration_ms` (number), `cached` (boolean) and `region`
(string).

The 12 fixtures hold 5 to 200 records, built deterministically. Messages, routes
and regions include quotes, backslashes, a line break, a tab, `<` and `&`,
a `%` sign, accented and Japanese text, and an empty string, so a line that is
not escaped as JSON fails.

## The sink and the logger

The logger and its sink are set up once, when the adapter loads, the way an
application configures logging at start-up. The sink is an in-memory buffer
(a string, a `StringIO`, a `bytes.Buffer`, a `Vec<u8>`), so no system call is
timed. The call logs the records, then returns the sink's content and empties
it. Because the same fixtures are logged again and again, a library option that
drops or merges repeated records must be off (see `consola`).

The threshold is `info`. Each library is set up to write JSON with the
formatter, layout or renderer its documentation names for that. Where the
library has none (`consola`, Python `logging`, Ruby `Logger`) the adapter gives
it a formatter that writes `JSON.stringify` / `json.dumps` / `JSON.generate`
of the level, a time, the message and the fields, which is the approach the
library's documentation shows; that formatting is then part of what that entry
measures. Every library writes whatever timestamp its JSON setup writes by
default.

## What counts as correct

Libraries name things differently, and none of that is compared. Each captured
line must be one JSON object, in the order logged, one per record. The verifier
reads from it:

- the level, under `level`, `levelname`, `severity`, `lvl` or `@level` (or as an object
  with a `name`), in any case, as `info`, `warn`/`warning` or `error`/`err`
  (slog writes `ERRO`);
- the message, under `message`, `msg`, `event`, `text` or `@message` (hclog
  writes `@level` and `@message`), at the top level or inside a nested object;
- each of the five fields, at the top level or inside one nested object named
  `fields`, `extra`, `properties`, `context`, `data`, `meta`, `attributes`,
  `mdc` or `args`. loguru's `serialize` output, `{ text, record }`, is read from
  `record`.

The message and the level are compared exactly, and the five fields with
`deepEqual` (so a lost, renamed, retyped or changed value fails). The timestamp
is not compared and no key is required for it: whatever key a library puts it
under, and every other key (logger name, process id, caller, target), is
ignored. A missing, extra or reordered record fails. At load the scenario also
checks that plain text lines, lines without the fields and lines with a wrong
level, message or value are refused.

## Packages

- `consola`: `createConsola({ reporters: [...], throttle: 0 })`;
  `logger.info(message, fields)`. It has no JSON reporter; the reporter is the
  adapter's own and writes `JSON.stringify` of the entry. Its default throttle
  collapses identical records repeated within a second, which the benchmark
  does constantly, so it is switched off.
- `@std/log` (JSR): `setup()` with a `BaseHandler` subclass that keeps the
  formatted text and `jsonFormatter`; `logger.info(message, fields)`.
- `@logtape/logtape` (JSR): `configureSync()` with a function sink that
  appends `jsonLinesFormatter(record)`; `logger.info(message, properties)`.
- `tracing` + `tracing-subscriber` (Rust): a global `fmt().json()` subscriber
  writing to a shared `Vec<u8>`; `info!(user_id, route, ..., "{}", message)`.
- `slog` + `slog-json` (Rust): `Json::default` over a `Mutex` drain into a
  shared `Vec<u8>`; `info!(logger, "{}", message; "user_id" => ...)`.
- `structlog`, `python-json-logger`, `loguru` (PyPI): `JSONRenderer`,
  `JsonFormatter` and `serialize=True`.
- `logging` and `console` (RubyGems): the `json` layout (the fields go through
  the mapped diagnostic context, `Logging.mdc`) and `Console::Output::Serialized`.
- `zap`, `logrus`, `go-kit/log` (Go modules): the JSON encoder, `JSONFormatter`
  and `NewJSONLogger`.
- Standard library: Python `logging`, Ruby `Logger` and Go `log/slog` with
  `JSONHandler`. Node has no logger with levels and fields.

Rust, Go and Python/Ruby adapters read the fields out of the input (JSON) inside
the call; JavaScript passes the `fields` object on as it is.

Left out: `lumberjack` (RubyGems) writes text; its JSON output is a separate gem.
`mixlib-log`, `mono_logger` and `glog` have no fields or no JSON. `logr` is an
interface without a formatter. `colorlog` and `coloredlogs` write coloured
text. `tracing-appender` only moves writes to a thread and `@logtape/file`,
`@logtape/redaction`, `@eai/logging-ts`, `@mapokapo/simcolog`, `@denosaurs/log`
and `@rubiks/rubiks` are sinks, redaction or tiny console wrappers (the last
three also tied to Deno or the console). `pino`, `winston` and `bunyan` are not in
the category's list of packages and are not included.

See [shared methodology](../../README.md) for timing and reproduction.
