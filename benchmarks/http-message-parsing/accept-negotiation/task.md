# Accept header preference order

One operation parses one HTTP `Accept` header value, held as a string, and
returns its acceptable media ranges in order of preference. The 48 cases are
headers of 2 to 10 ranges in the shapes browsers and API clients send: concrete
types (`text/html`, `application/xhtml+xml`, `image/avif`,
`application/vnd.api+json`), parameters (`level=1`, `v=b3`,
`charset=utf-8;header=present`, a quoted `profile="https://…"`), type wildcards
(`image/*`, `text/*`) and `*/*`, q-values from `0.001` to `1.0` with up to
three decimals, ranges without a q (which means 1), and ranges marked `q=0` or
`q=0.0`. Separators are `,` or `, ` and `;` or `; `.

## What counts as correct

The scenario computes the answer itself: the ranges with q above zero, highest
q first, ranges with equal q in the order the header lists them. Ranges with
`q=0` are left out, because RFC 9110 (section 12.4.2) makes q=0 "not
acceptable"; `negotiator` drops them and the other adapters filter them out in
the timed call. The list is compared exactly, entry by entry.

An entry may be written as each library returns it, which is style:

- a string `type/subtype`; parameters after a `;` are allowed and not
  compared;
- an object with the type and subtype as fields (`type`/`Type`,
  `subtype`/`subType`/`SubType`); its other fields (q, parameters) are not
  compared.

Parameters are parsed (a parser must step over them, including a quoted value
with `:` and `/` in it, to find the next range and the q) but not compared,
because `negotiator`'s `mediaTypes()` returns only `type/subtype`.

The fixtures stay inside what the specification and every package agree on:

- **A wildcard always has a lower q than every range more specific than it**
  (concrete above `type/*` above `*/*`), and equal q only joins ranges of the
  same specificity. RFC 9110 orders by q and leaves ties to the server;
  `negotiator` and `http-accept` keep header order for equal q, while
  `goautoneg` puts a concrete range before a wildcard. Worse, `goautoneg`'s
  comparator says a concrete range comes before a wildcard whatever their q
  values, so a header such as `text/plain;q=0.5, */*` gives no defined order
  there. Real headers almost always put the wildcard lowest (`*/*;q=0.8`
  after the types); the fixtures keep to that. `q=0` on a concrete range
  appears only in headers with no wildcard ranges, for the same reason.
- **At most 12 ranges.** `goautoneg` sorts with Go's `sort.Sort`, which is not
  stable in general; up to 12 elements it is an insertion sort, which is.
- **No commas, semicolons or equals signs inside parameter values**, and only
  spaces as white space: `goautoneg` splits on those characters without
  reading quotes and trims spaces only.

When the scenario loads it proves the check refuses the header unchanged, the
ranges in header order, a list that keeps the q=0 ranges, the list lowest q
first, ties in reverse header order, q truncated to one decimal (0.85 and 0.8
fall together), q read as a whole number, another fixture's list and a
constant. 44 of the 48 answers differ from header order, 34 have ties, and 7
have q=0 ranges to leave out.

Packages run with their default settings, one parse per call, nothing kept
between calls. Negotiating against a list of available types, and the
`Accept-Language`, `Accept-Encoding` and `Accept-Charset` headers, are outside
this task.

## Packages

| Entry | What the adapter calls |
| --- | --- |
| `npm/negotiator` | `new Negotiator({ headers: { accept } }).mediaTypes()`, a list of `type/subtype` strings (q=0 already left out) |
| `rubygems/http-accept` | `HTTP::Accept::MediaTypes.parse(header)`, a list of `MediaRange` structs sorted by q (stable); the adapter keeps those with `quality_factor > 0`, and `describe` gives `mime_type` for each, outside the timed call |
| `gomod/github.com/munnerz/goautoneg` | `goautoneg.ParseAccept(header)`, a slice of `Accept{Type, SubType, Q, Params}`; the adapter keeps those with `Q > 0` |

The package entries are written separately; this list says what each is to
call.

## Left out

- Standard libraries: Node, Bun and Deno, Python, Ruby and Go have no Accept
  parser. Go's `mime.ParseMediaType` reads one media type, not a list, and
  ordering by q by hand would be writing the job, so there is no builtin
  entry.
