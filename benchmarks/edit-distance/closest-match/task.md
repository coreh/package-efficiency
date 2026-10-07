# Closest match in a word list

One operation takes a mistyped query and a list of 25 to 70 candidate words and
returns the index of the candidate with the smallest Levenshtein distance to the
query. When several candidates tie, the first one in the list wins. This is the
"did you mean" job: many short comparisons, one decision.

The 40 cases are queries of 3 to 18 characters (command names, option names and
identifiers, with typos such as dropped, doubled, swapped and substituted
letters, plus a few queries with accented Latin letters, all in the Basic
Multilingual Plane) against lists of lowercase words, some with accents. Some
queries are exact words, some are far from everything, and some tie between
candidates. Every output must equal the index chosen by an independent
dynamic-programming oracle in `scenario.mjs` using the same tie rule. A constant
or a first-element answer fails because the expected indices vary.

Packages run with default settings: `fast-levenshtein` without a locale
collator, `leven` and `strsim::levenshtein` with no options. None of them has a
"closest" function, so each adapter runs the same plain loop (call the package's
distance function on each candidate, keep the first strictly smaller distance)
in its own language. The loop is identical everywhere; the distance calls are the
package's own work. No distance limit option is used, and no result is cached.

Inputs are created before timing. Characters are one UTF-16 code unit in
JavaScript and one scalar value in Rust; in the Basic Multilingual Plane these
agree. Each language consumes the integer index directly.

See [shared methodology](../../README.md) for timing and reproduction.
