# Extract capture groups of every match

One operation receives `{ pattern, text }`: a regular expression as source text
with capture groups, and an ASCII text of a few kilobytes (log lines, emails,
URLs, addresses, dates, prices, colors, quoted strings). The operation returns,
for every non-overlapping match in order, the list of its capture groups 1..n
as strings (the whole match is not included). No match gives an empty list.

This differs from plain match finding: the engine must also report where each
group matched, which is a different, usually slower, code path in most engines.

The 40 cases are 20 patterns, each on two different texts. The patterns use
only syntax JavaScript, Rust `regex`, Python, Ruby and Go share: literals,
classes, `\d \w \s \b`, alternation, greedy and lazy quantifiers, counted
repetition, and capturing and non-capturing groups. No pattern can match the
empty string, and every capture group takes part in every match (no optional
groups), so every engine reports the same groups. The texts are ASCII, so ASCII
and Unicode readings of `\w` and `\b` agree. Outputs must equal a reference
computed with JavaScript `RegExp` and `matchAll`.

Compiling is not measured. Every entry, in every language, compiles each of the
20 patterns the first time it sees it and reuses the compiled pattern, during
warm-up. Packages run with their default settings as installed. Engines whose
groups are not already strings or spans are mapped inside the call.

Engines hand groups back in different forms and each entry keeps the form its
engine gives: JavaScript, Python and Ruby build a new string per group; Go's
group strings share the text's memory, with one slice per match; the Rust
crates' groups borrow from the text, so those adapters keep each group's byte
span, one `Vec` per match, and copy no text. `describe` slices the text with
the spans for the verifier and is not timed. `@rregex/rregex` is Rust `regex` compiled to WebAssembly; its 20
compiled objects are kept for the life of the process.
`@shahriyardx/regex` (ready-made validators) and the `matchers` crate (boolean
matching for tracing filters) do not offer this operation and are left out.
