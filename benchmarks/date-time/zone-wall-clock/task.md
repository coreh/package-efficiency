# Convert UTC instants to wall-clock time in named zones

One operation takes `{ zone, instants }`: an IANA time zone name such as
`Australia/Lord_Howe` and 200 instants as whole seconds since the Unix epoch
(UTC). For each instant it returns `[localDateTime, offset]`: the wall-clock
date-time in that zone as `YYYY-MM-DDTHH:MM:SS` (no offset or zone written
after it), and the zone's UTC offset at that instant in seconds east of UTC
(an integer: `-14400` in New York in summer, `20700` in Kathmandu). The result
is the list of 200 pairs, in input order.

This is the category's job on time zone rules: the other two tasks parse,
add calendar months, and subtract instants with fixed offsets; this one
looks up which offset a named zone has at an instant. The 12 fixtures are
one per zone:

- `America/New_York`, `America/Los_Angeles`: United States daylight-saving rules.
- `America/St_Johns`: a half-hour offset (-03:30) with daylight saving.
- `Europe/London`, `Europe/Berlin`: European Union rules, changing at 01:00 UTC.
- `Asia/Kolkata` (+05:30), `Asia/Kathmandu` (+05:45), `Asia/Tokyo` (+09:00): fixed offsets.
- `Australia/Adelaide`: a half-hour offset with southern-hemisphere daylight saving.
- `Australia/Lord_Howe`: +10:30, and a daylight-saving shift of 30 minutes, not an hour.
- `Pacific/Auckland`, `Pacific/Chatham` (+12:45 and +13:45): New Zealand rules.

For a zone with daylight saving, 60 of its 200 instants sit at 15 transitions
spread over the years: one second before, the instant of the change, one
second after, and 30 minutes after (inside the skipped or the repeated hour of
wall-clock time). The other 140, and all 200 of a fixed-offset zone (some at
local midnight on 1 January and one second before local midnight on 31
December), are spread over 2012 to 2024 by a fixed-seed generator.

## Time zone data

Every entry uses some copy of the tz database, and not the same one: the
JavaScript runtimes use their ICU's, Python's `zoneinfo`, Go's `time`,
`python-dateutil` and `arrow` read the system's zoneinfo files (on the machine
of the first results, tzdata 2026d), `jiff` reads them too, `pytz` bundles its
own, and `pendulum` reads the `tzdata` package it requires. So the fixtures
stay where those copies cannot disagree: instants from 2012 to 2024 only, in
zones whose rules for those years have not changed in any recent release. No
zone with recent changes (Chile, Brazil, Paraguay, Mexico, Greenland, Egypt,
Kazakhstan) and nothing before 1970 is used.

The expected values come from no entry. The scenario writes out the rules each
zone followed throughout those years (the US second-Sunday-of-March and
first-Sunday-of-November changes at 02:00 local time, the EU last Sundays at
01:00 UTC, South Australia and Lord Howe's first Sundays of October and April,
New Zealand's last Sunday of September and first Sunday of April at 02:00
standard time) and computes every pair from them. At load it checks all 2,400
of them against the runtime's `Intl.DateTimeFormat` and refuses to load if one
differs.

## What counts as correct

Every pair must equal the expected one exactly: the date-time string byte for
byte and the offset as an integer number of seconds. Nothing is forgiven: not a
fractional-seconds part, not an offset or zone name written after the
date-time, not an offset in minutes or as text. The scenario proves at load
that the check refuses UTC instead of local time, standard time all year round,
the offset in minutes, a date-time one second off, the offset appended to the
date-time, and another zone's results.

Each library's own result type is mapped to the pair inside the measured call,
in every entry alike: the formatting of the local date-time into the string
and the reading of the offset are part of the timed work. Looking the zone up
by its name happens once per fixture in `prepare`, outside timing (a
`ZoneInfo`, a `time.Location`, an `Intl.DateTimeFormat`, a jiff `TimeZone`),
because some libraries build that object at a cost far above 200 conversions
and others cache it by name; what is measured is the conversions. Packages run
with their default settings as installed. No result is cached between calls.

## Entries

- `builtin/js-intl`: one `Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', … })`
  per zone, made in `prepare`; `formatToParts(t * 1000)` per instant, the
  fields padded into the string, and the offset taken as the local fields read
  as UTC minus the instant (`Intl` has no numeric offset).
- `builtin/python-zoneinfo`: `ZoneInfo(name)` in `prepare`;
  `datetime.fromtimestamp(t, zone)`, `strftime('%Y-%m-%dT%H:%M:%S')` and
  `utcoffset()` in seconds.
- `builtin/go-time`: `time.LoadLocation(name)` in `prepare`;
  `time.Unix(t, 0).In(loc)`, `Format("2006-01-02T15:04:05")` and the offset
  from `Zone()`.
- PyPI `pytz`: `pytz.timezone(name)` in `prepare`; `datetime.fromtimestamp(t, tz)`
  (which goes through the zone's `fromutc`).
- PyPI `pendulum`: the zone from `pendulum.timezone(name)` in `prepare`;
  `DateTime.fromtimestamp(t, tz=zone)` (`pendulum.from_timestamp` returns a wrong hour on PyPy at some transitions).
- PyPI `arrow`: the zone from `dateutil.tz.gettz(name)` in `prepare`;
  `arrow.get(t).to(zone)`.
- PyPI `python-dateutil`: `dateutil.tz.gettz(name)` in `prepare`;
  `datetime.fromtimestamp(t, tz=zone)`.
- cargo `jiff`: `TimeZone::get(name)` in `prepare`; per instant
  `Timestamp::from_second(t)` and the zone's civil date-time and offset at it.
- RubyGems `tzinfo`: `TZInfo::Timezone.get(name)` in `prepare`; the local time
  at `Time.at(t)` and its UTC offset.

## Left out

- Ruby's standard library: `Time` takes fixed offsets only (`Time.at(t, in: '+05:45')`);
  a named zone needs the process-wide `ENV['TZ']`, which is not a library call
  for one zone. There is no `builtin` Ruby entry.
- `JavaScript Date` alone: it knows only the process's local zone and UTC;
  conversion to a named zone goes through `Intl`, which is the `js-intl` entry.
- Instants after 2024 and before 2012, and zones whose rules changed in recent
  tz releases, as above: entries with different copies of the database would
  then disagree for reasons that are the data's age, not the library's work.
