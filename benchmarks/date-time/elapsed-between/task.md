# Parse two timestamps, whole hours, minutes and seconds between

One operation takes `{ from, to }`, two RFC 3339 timestamps such as
`2024-03-10T08:15:30Z` or `2023-11-05T22:40:00+05:30`. Some carry fractional
seconds (`.25` or `.5`, on one side only). The operation parses both and returns
the elapsed time from `from` to `to` as `[hours, minutes, seconds]`: three
integers, each the total number of whole units in the elapsed time, truncated
toward zero (the sign follows the direction; `to` before `from` gives negative
numbers). They are totals, not a breakdown: 90 minutes is `[1, 90, 5400]`.

This is the second job of the category: the first task adds calendar months and
formats; this one parses with offsets and measures a span between two instants,
and never formats. The 48 cases mix `Z` and numeric offsets (from -08:00 to
+09:30), both directions, gaps from a few seconds to about 20 years, years 1970
to 2100 and some fractional seconds. Results are checked against an independent
oracle written with UTC millisecond arithmetic. A result of negative zero is
accepted as zero.

The elapsed time is between instants, so the process time zone does not matter.
Only the three totals are compared. Packages run with their default settings as
installed. No result is cached between calls.

Left out: `d3-time` and `d3-time-format` have no RFC 3339 offset parsing (d3-time-format
parses by pattern and would be a different job); `time` formatting helpers are not
used. JSR packages (`@std/datetime` and others) have no parse for this input.
