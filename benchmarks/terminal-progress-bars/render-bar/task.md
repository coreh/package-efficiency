# Advance and render a progress bar

One operation takes `{ total, steps }`, creates a progress bar for `total`
units, advances it `steps` times by one, and returns the last frame the bar
wrote to an in-memory stream. There are 5 cases (1000 of 1000, 300 of 400,
500 of 2000, 100 of 100, 200 of 800), so a pass is 2,100 steps.

**Throttling is off.** Bars normally redraw at most every 16 to 100 ms,
which would make the work depend on the clock. Each adapter turns that off
the way its library allows, so every step is drawn: `renderThrottle: 0`
(progress), `mininterval=0, miniters=1` (tqdm), `throttle_rate: 0`
(ruby-progressbar), `term_like` without a rate limiter plus `force_draw()`
(indicatif), `set_max_refresh_rate(None)` (pbr), `update(i, force=True)`
(progressbar2), static mode with `Write()` (cheggaaa/pb). Everything else is
the library's default. Where a library needs a format string it is
`[:bar] :percent` (progress); the others use their default format.

**The stream** is a small object in every adapter that looks like a
terminal 80 columns wide (a TTY where the library asks) and keeps only the
last write that has a visible character. Nothing else is stored.
This is the same in every language. No clock, no real terminal, no
network. Elapsed time and ETA are drawn by the libraries but the check does
not read them.

**What counts as correct.** The check takes the last non-blank line of the
returned text (ANSI codes removed; carriage return and line feed both end a
line) and requires at least one of these, and that every one it finds is
right:

- a percentage (`75%`, `75.00 %`);
- a count `done/total` or `done / total` with the right total;
- a bar between `[ ]` or `| |` made of a run of one fill character, an optional
  head (`>` or a partial block), then one other character for the rest, with
  the filled share of the width within one and a half cells of the truth.

The fill and rest characters are the library's own (`=`, `-`, `█`, `░`,
spaces), and so are the format and the spacing. The percentages are whole
(100, 75, 25), so rounding rules do not matter. A bar that drew nothing, drew
the wrong state, or did not advance fails.

**Left out.**
- Spinners (`ora`, `tty-spinner`, `kia`, `nanospinner`): they redraw on a
  timer and have no progress to check.
- `cli-progress` (npm): it redraws from a timer and its synchronous redraw is
  throttled by a millisecond clock with no way to switch it off.
- `@deno-library/progress` and `@david/console-static-text` (JSR): the first
  writes to Deno's stdout and the second is a general text region, not a bar.
- `gopkg.in/cheggaaa/pb.v1`: its newest dependency set needs a newer Go than the
  pinned one.
- No standard library in JavaScript, Python, Ruby or Go has a progress bar, so
  there are no built-in entries.

The work measured is bar creation, `steps` redraws (layout, percentage, bar
string) and the library's clock reads; it is not the cost of a real terminal.

See [shared methodology](../../README.md) for timing and reproduction.
