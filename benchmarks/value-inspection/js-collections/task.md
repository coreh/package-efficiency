# JavaScript collections and special values

One operation takes a JavaScript value and returns a human-readable string for
it, the way a logger, assertion message or snapshot would show it. The first
task in this category uses JSON-compatible records; this one uses what JSON
cannot hold. The 56 cases are session caches (Map of objects holding Sets and
Dates), orders (BigInt ids, Dates, Maps of totals, `undefined` fields), class
instances (`Point`, `Dimension`, `Money`) with RegExps and Sets, graphs (Map of
number to Set), arrays of Maps, job configs, and a few small values on their
own (empty Map and Set, a Date, a BigInt, a RegExp). Containers never nest more
than three levels deep, because several packages collapse deeper levels by
default (inspect depth 2).

Packages do not agree on the output format (`Map(2) { 'a' => 1 }`,
`Map {"a" => 1}`, `Map{ 'a' => 1 }`), so the check does not compare text. A
correct output is a string that, for the input value:

- contains every object key, every string (RegExps as `/source/flags`), every
  number and every BigInt (digits, without the `n` suffix) at least as many
  times as the value does, numbers as whole tokens,
- contains the year of every Date (all dates are mid-year and midday UTC, so the
  year is the same whether a package prints ISO or local time),
- contains the word `Map` and `Set` for every Map and Set, the class name for
  every class instance, and `undefined` for every undefined value,
- contains no truncation or collapse marker (`[Object]`, `[Array]`, `[Map`,
  `[Set`, `...`, `…`, `more item`),
- is at least as long as the combined length of those tokens.

Order, quoting, indentation, line breaks and the way a Date is written are
accepted as equivalent. Strings avoid quotes, backslashes and line breaks, so no
package needs to escape them differently. Packages run with default settings as
installed; the work is one call that returns the string, and the result is
consumed by its length only. The standard-library baseline is `util.inspect`.

`@console/dump` (JSR) is left out: its `dumpStr` prints Maps, Sets, Dates and
RegExps as empty objects, so it cannot do this job. Only JavaScript adapters
exist because Python, Ruby, Go and Rust have no equivalent of these values
shared by the fixtures.
