# Namespaced request lines

A project has 100 namespaces, `app:<area>:<n>` with ten areas (`web`, `db`,
`cache`, `queue`, `auth`, `search`, `mail`, `cron`, `api`, `fs`) and n from 0
to 9. The pattern enables five areas, `web`, `db`, `cache`, `auth` and `api`
(50 namespaces), and the other 50 are disabled. Each adapter applies that
pattern once, at load, the way the `DEBUG` environment variable would.

An input is `{ id, ns, method, path, ms }`: `ns` is the namespace and `id` its
number from 0 to 99 (area index times ten, plus n). One operation is one call on
the logger of one namespace, with a method, a path and a duration: the message is "<method> <path> took <ms>ms", formatted by the
library from its own format string and arguments. The 100 inputs cover every
namespace once, with varied methods and paths (including Unicode and percent
signs) and durations.

A correct output is the line the library wrote to its sink. For a disabled
namespace it is the empty string. For an enabled one it must contain the
namespace and end with the formatted message (a trailing newline is accepted).
Everything else on the line is the library's own decoration and is accepted as
it is: timestamps, level names, colour codes, brackets and `+Nms` suffixes
differ between packages and are not compared.

The sink is an in-memory capture instead of stderr, so no system call is timed.
JavaScript sinks do what Node's own default sink does (`util.format`, plus a
newline) and keep the string; the Rust sink is a byte buffer taken after each
call. In JavaScript the 100 loggers are created once at load, as an application
does with module-level loggers, and the call picks one from an array by `id`, so
no name lookup by the adapter is timed. `env_logger` has no logger per
namespace: its one logger takes `ns` as the record's target.

Packages run with default settings as installed, with one exception. `debug`
and `obug` choose their line format from the `DEBUG_COLORS` and
`DEBUG_HIDE_DATE` environment variables and from whether stderr is a terminal.
Their adapters set those options explicitly (no colours, date prefix shown,
which is what both do by default when stderr is not a terminal), so stray
environment variables cannot change what is measured.

`google-logging-utils` is included: its default backend writes through
`console.error`, which the adapter replaces with the capture, so the library's
own formatting is kept. Not compared: `env_filter` only matches targets and does
not format; it is left out.
