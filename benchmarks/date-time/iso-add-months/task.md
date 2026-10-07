# Parse, add calendar months and days, format

One operation takes `{ ts, months, days }`. `ts` is an ISO 8601 local date-time
without a zone, such as `2024-01-31T10:30:45`. The operation parses it, adds
`months` calendar months (negative values subtract), then adds `days` calendar
days, and returns the result as `YYYY-MM-DD HH:mm:ss`.

Adding months keeps the day of the month where it exists and otherwise clamps to
the last day of the target month (31 January plus one month is 29 February in a
leap year). Months are added first, then days. The time of day is unchanged.

The 48 cases cover every month, leap and non-leap years, the 29th, 30th and 31st,
negative and large offsets (up to 400 months, 400 days) and varied times of day.
Outputs must equal an independent oracle written with UTC date arithmetic. There
are no accepted spelling differences: the output format is fixed, so any
formatting is part of the measured work.

Inputs are wall-clock values with no zone. The entries do not all treat them
the same way. The JavaScript entries (`date-fns`, `dayjs`) parse the text into a
JavaScript `Date`, read as a time in the process's local time zone, and do the
month and day arithmetic and the formatting through local-time `Date` fields, so
each call goes through the runtime's time-zone rules. The Rust entries (`chrono`
`NaiveDateTime`, `jiff` `civil::DateTime`) do civil date-time arithmetic: a
calendar date and a clock time with no zone and no instant behind it. That is
each library's ordinary way to handle a zoneless timestamp, but it is not the
same amount of work. Times of day are between 06:00 and
21:59 and years stay within 1950 to 2100, so daylight-saving gaps cannot change the
answer in whichever zone the process runs. Packages run with their default
settings as installed. Time zone databases, parsing of zones and offsets, and
durations in hours or smaller are outside the contract. All inputs are
preconstructed strings; no result is cached between calls.

Left out: `time` (Rust) has no calendar-month addition; `d3-time` offsets months
by overflowing `setMonth`, which does not clamp; the standard libraries of
JavaScript, Python and Go also lack clamping month arithmetic, so there are no
built-in adapters.
