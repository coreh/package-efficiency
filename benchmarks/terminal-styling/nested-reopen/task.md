# Nested styles that must reopen

The existing `ansi-styles` task nests styles that never share a close code. This
task measures the harder, common case: an inner span closes with a code that
also switches off the outer style, so the library has to detect the inner close
and reopen the outer style after it. That is extra scanning and string
rewriting that plain wrapping does not do.

One operation styles one string. An input is `{ style, a, b, c, d, e }` of
preconstructed text pieces. Five styles are used, round-robin across 62 cases:

- `red-green-twice`: red wraps `a + green(b) + c + green(d) + e`;
- `blue-yellow`: blue wraps `a + yellow(b) + c`;
- `bold-dim`: bold wraps `a + dim(b) + c` (bold and dim both close with `22`);
- `three-level`: red wraps `a + green(b + blue(c) + d) + e`;
- `bold-red-dim`: bold wraps `a + red(b + dim(c) + d) + e`.

Text mixes ASCII, Unicode and emoji, with no newlines. Two cases have some empty
pieces.

A correct output is a string whose escape codes, when interpreted, give the same
text runs and styles as the reference: after every inner span the outer color
or bold is on again, inner text carries both styles, and nothing is left open at
the end. Only SGR sequences (`ESC [ ... m`) are accepted. Different spellings
of the same effect are equivalent: combined or separate codes, reset (`0`) or
specific closes, redundant open/close pairs around empty text. The check
compares the rendered result, not the bytes, and an output that merely wraps
without reopening fails.

Packages run with their default settings as installed, with one exception: no
measured process has a terminal, so each adapter switches colors on with the
option its documentation gives. Color detection is not measured.

Each result is a string and the measured loop reads only its length. A
JavaScript engine may hand back a string that is still a tree of concatenated
parts and never copy it into one buffer, while the Rust entry writes every
byte of its result; the Rust figure may include that copy where a JavaScript
figure does not.

## Who is included

Only packages that reopen outer styles by themselves are included: `chalk`,
`picocolors`, `colorette`, `kleur`, `tinyrainbow`, Node's `util.styleText` and,
in Rust, `colored`. `@std/fmt` and `@cliffy/ansi` were tried and fail the check
(they wrap without reopening), so they are removed. `yansi`, `owo-colors` and
`nu-ansi-term` close with a full reset and do not reopen, so they are left out
without being tried.

See [shared methodology](../../README.md) for timing and reproduction.
