# Namespace pattern matching

An application has a pattern that switches debug output on by namespace, the
way the `DEBUG` environment variable does. The pattern enables seven prefixes:
`app:web:`, `app:db:`, `app:cache:`, `app:auth:`, `lib:http:`, `worker:` and
`svc:billing:` (written as `app:web:*,...` for the JavaScript packages and as
`app:web:,...` filter directives for the Rust ones). Each adapter applies it once,
at load.

An input is `{ ns }`, a namespace such as `app:db:pool:v2`. One operation asks
the library whether that namespace is enabled and returns a boolean. The fixtures
(about 160) are namespaces from fifteen groups with several names and suffixes
each, plus edge cases. Many are near misses that share a start with an enabled
prefix but are not in it (`app:webhook:send`, `lib:http-cache:store`,
`svc:billing-legacy:sync`, `workers:pool`, `app:web` without the trailing colon).

Where the existing request-lines task measures formatting and writing a line,
this one measures only the decision: the cost of matching a namespace against a
pattern. No logger is created in any entry. `debug` and `obug` export a public
`enabled(name)` function (`createDebug.enabled` in `debug`), the same one a new
logger calls for its `enabled` property, and the adapters call it directly. The
Rust crates ask the filter: one `Metadata` (level info, the namespace as target)
is built per call and passed to `env_logger::Logger::enabled` or
`env_filter::Filter::enabled`. In the Rust adapters the namespace string is read
out of the fixture before timing.

The two Rust entries are one implementation: `env_logger`'s
`Logger::enabled` only delegates to the `env_filter` crate (2.0, its
dependency), and the `env_filter` entry is the same crate at its 0.1 line, whose matching
code is unchanged in 2.0. The
Rust match is a handful of prefix comparisons, so those figures sit close to
the cost of the harness loop itself and small differences between them mean
little.

A correct output is true for a namespace that starts with one of the enabled
prefixes and false for every other. The verifier checks every fixture, so a
constant or an always-on or always-off adapter fails. Packages run with their
default settings as installed.

Not included: `google-logging-utils` (no way to ask whether a namespace is
enabled, and it caches loggers by name, so it cannot be asked the same question);
`@sigma/dbg` is a value printer, not a namespaced logger.
