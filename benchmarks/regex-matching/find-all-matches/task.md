# Find all matches of a pattern

One operation receives `{ pattern, text }`: a regular expression as source text
and an ASCII text of a few kilobytes (log lines, prose, emails, URLs, addresses,
dates, prices, colors, quoted strings). The operation returns the list of all non-overlapping matches, in order, as strings. No match
gives an empty list.

The 40 cases are 20 patterns, each on two different texts. The patterns use
only syntax that JavaScript, Rust `regex`, Python, Ruby and Go share: literals,
classes, `\d \w \s \b`, alternation, greedy and lazy quantifiers, counted
repetition and non-capturing groups. None can match the empty string and none
has capture groups, so every engine returns the same list. The texts are ASCII,
so ASCII and Unicode readings of `\w` and `\b` agree. Outputs must equal a
reference computed with JavaScript `RegExp`.

Compiling is not what is measured. Every entry, in every language, compiles
each of the 20 patterns the first time it sees it and reuses the compiled
pattern afterwards, the way code that matches repeatedly is written. That first
use happens during warm-up, so the figures are for matching.
Packages run with their default settings as installed. Only matched text is
compared, not offsets, because string offsets differ between UTF-16, UTF-8 and
code points; engines that report offsets are mapped to the matched text inside
the call.

Rust crates return `Vec<String>`; `describe` (to JSON for the verifier) is not
timed. `@rregex/rregex` is Rust `regex` compiled to WebAssembly; its 20 compiled
objects are kept for the life of the process.
`@shahriyardx/regex` (ready-made email/URL validators) and the `matchers` crate
(boolean matching for tracing filters) do not offer this operation and are left out.
