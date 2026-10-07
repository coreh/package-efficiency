# Next run times of cron expressions

One operation takes a five-field cron expression (minute, hour, day of month,
month, day of week), a start instant and a count of 50, and returns the next 50
run times strictly after the start, as the library's own list of `Date` values.
The expression is parsed inside the call in every adapter, because evaluating an
expression from text is the job being compared; the 50 occurrences are computed
with the library's "next N dates" call.

The 40 cases cover every-minute and stepped minutes, hourly, daily and weekly
schedules, weekday ranges and name aliases (`mon-fri`, `jun-aug`), lists, ranges
with steps, monthly and yearly dates, and sparse schedules (the 30th of a month,
the first week of a month). Starts are varied and always have a non-zero
seconds/milliseconds part, so the "strictly after" rule is never ambiguous.

Correctness: the scenario holds an independent reference that enumerates days,
then hours and minutes, and the 50 times returned must equal it exactly. A
constant, an unchanged input or a skipped computation fails. The scenario pins
`TZ=UTC` so DST gaps cannot make libraries differ.

Scope: no expression sets both day of month and day of week (libraries differ on
OR versus AND), no seconds field, no `L`/`#`/`W` extensions, no time zone option,
and the leap-day expression `0 0 29 2 *` is excluded because `cron-schedule`
gives up searching for it. Packages run with default settings as installed.

`@m4rc3l05/cron` is left out: it is a timer-driven job runner on top of
`cron-parser` and exposes no call that returns the next run times. No npm or
crates.io packages were in the brief. See [shared methodology](../../README.md).
