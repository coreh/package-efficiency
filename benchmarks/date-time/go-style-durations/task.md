# Parse compound duration strings such as 1h30m15s

One operation takes an array of 200 duration strings in the compact style of
Go's `time.Duration` (`1h30m15s`, `45m`, `90s`) and returns an array of the
same length holding the total of each string in seconds, in order: `1h30m15s`
is `5415`, `45m` is `2700`, `90s` is `90`.

Every string is one to three parts, each a run of decimal digits followed by
one unit letter, in the order `h`, `m`, `s`, with no spaces, no sign and no
fraction. Any part may be missing as long as one is there, and a part may be
zero (`0s`, `1h0m0s`) or larger than the next unit (`75m`, `3600s`, `4h138m`).

This is the category's job on durations: the other tasks parse instants, add
calendar months, subtract instants and convert to named zones; this one reads
a span written in units. The eight cases are built deterministically, 1,600
strings in all:

- the edges first (`1h30m15s`, `45m`, `90s`, `0s`, `0m`, `0h`, `1h`, `1h5s`,
  `1h0m0s`, `0h0m1s`, `59m59s`, `60m`, `60s`, `3600s`, `86400s`, `1440m`,
  `24h`, `9999h59m59s`, `100h`, `119m59s`, `2h75m`, `3h5m120s`), then strings
  from all the mixes below in turn;
- hours, minutes and seconds with minutes and seconds below 60, as Go writes a
  `Duration` (`20h2m22s`);
- minutes and seconds, or one of them alone (`32m58s`, `180m`, `446s`);
- seconds alone, up to a day (`65141s`);
- hours alone and hours with minutes (`56h`, `3h56m`);
- long spans of 100 to 9,999 hours with minutes and seconds (`6810h24m53s`);
- zero parts written out, and minutes and seconds zero-padded to two digits
  after hours (`5h0m0s`, `0h27m0s`, `0m38s`, `3h01m05s`);
- minutes or seconds above 59 next to a larger unit (`4h138m`, `9m156s`,
  `2h33m2236s`).

## What counts as correct

The scenario knows every total without parsing: it builds the text from the
components it writes, and computes `h * 3600 + m * 60 + s` from the same
numbers. At load it also reads every string again with a strict pattern and
refuses to load if that reading disagrees. A correct output is an array of 200
numbers equal to those totals exactly. An integer or a float with an integral
value both count (Python's `timedelta.total_seconds()` is a float, Go's and
Rust's whole seconds are integers): every total is below 2^53, so each reaches
the check as the same JSON number.

Anything else fails. When the scenario loads it proves the check refuses: the
strings returned as they came in, totals in minutes, only the first part of
each string read, `m` read as months (30 days) or as milliseconds, totals as
strings, one total off by one, a missing total and another fixture's results.

All inputs are valid, so error handling is outside this task. There are no
days or weeks (Go has no unit for them), no milliseconds or smaller units, no
fractions (`1.5h`), no sign, no spaces between parts and no bare `0` without a
unit: libraries differ on each of those, and the cluster's job is whole hours,
minutes and seconds.

Each library's duration value is turned into whole seconds inside the measured
call, in every entry alike (`.as_secs()`, `.total_seconds()`, a division by
`time.Second`): that reading is part of the timed work. Packages run with
their default settings, as installed. Each adapter parses the strings one at a
time with the package's single-string function and collects the results; the
loop and the output array are in every adapter alike. No result is cached
between calls.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/go-time` | `time.ParseDuration(s)` for each string, the `Duration` divided by `time.Second` into a `[]int64`; an error panics. The strings become a `[]string` in `prepare`, outside timing. |
| PyPI `pytimeparse` | `pytimeparse.parse(s)` for each string; an `int` (it returns `None` for a string it cannot read, which the check refuses). |
| PyPI `durationpy` | `durationpy.from_str(s).total_seconds()` for each string; a `float` with an integral value. |
| cargo `humantime` | `humantime::parse_duration(s)?.as_secs()` for each string; a `u64`. It reads `1h30m15s` without spaces: a digit after a unit starts the next part. |

The package entries are written separately; this list says what each is to
call.

## Left out

- npm `ms` and JSR `@wilcosp/ms-relative` read a single unit only (`2h`,
  `90s`), not a compound string; they would need a task of single-unit strings
  of their own.
- PyPI `isoduration` parses ISO 8601 durations (`PT1H30M15S`), another syntax.
- JavaScript `Temporal.Duration.from` also reads ISO 8601 only, and is not on
  every runtime; there is no `builtin` JavaScript entry.
- Python's and Ruby's standard libraries have no function that parses a
  duration string, so there is no `builtin` Python or Ruby entry, and none is
  written by hand.
- Rust's standard library has no duration parser, and there is no `builtin`
  path for Rust in any case.

See [shared methodology](../../README.md) for timing and reproduction.
