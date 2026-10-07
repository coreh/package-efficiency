# Strip common indentation

One operation takes a multi-line string and removes the leading whitespace shared
by all its non-empty lines, keeping relative indentation. The 48 cases are code,
YAML, SQL, HTML, CLI help and prose blocks (7 to about 150 lines) with a base
indentation of 2 to 16 spaces, nested deeper lines and empty lines. Indentation
is spaces only, empty lines are truly empty, and there are no backslashes or
backticks. Each block starts and ends with a newline, like a template literal.

Outputs must match an independent reference (minimum indentation of the non-empty
lines removed from every line). Accepted as equivalent: dropping the leading
newline and trailing whitespace (some packages trim, others keep them); the
indentation of every kept line is still compared. A package that returns its
input unchanged fails for the indented cases. Packages run with default settings
as installed. This is dedenting only: adding indentation, wrapping and formatting
are out of scope.

- `strip-indent`: `stripIndent(text)`.
- `redent`: `redent(text)` with the default indent count of 0. That is `indentString(stripIndent(text), 0)`, and
  `indent-string` returns its input at count 0, so this entry runs the same `strip-indent` code as the entry above
  and the two rows differ only by noise.
- `dedent`: `dedent(text)`; it also trims surrounding blank lines.
- `min-indent` is left out: it only measures indentation, so the adapter would have to do the stripping itself.
- Python: `textwrap.dedent`. Ruby and Go have no standard-library function (Ruby's `<<~` is compile-time).
- Rust: `unindent::unindent`, returning an owned `String`. `indoc` is left out: it is a compile-time macro with no runtime function.

Every block is indented (2 to 16 spaces), because template-literal packages such as
`dedent` and `undent` treat an unindented first line as part of the opening and
give different answers for it; that is a convention difference outside the task.
`undent` is called as `undent.string(text)`, its documented form for plain strings.
