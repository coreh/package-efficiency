# Group values under string keys in a multimap

This is the multimap job of a hash table: one key, several values, kept in the
order they were added. One operation takes four lists of strings: `keys` and
`values` (10,000 of each, the pair at position `i` is `keys[i]`, `values[i]`),
`remove` (100 keys) and `read` (500 keys). With the library's multimap it does,
in this order:

1. create an empty multimap and add every pair, in list order (a key that is
   already there gets one more value at the end of its list; a value the key
   already holds is added again);
2. remove each key of `remove` with all its values (a key that is not there, or
   was removed already, is no error and changes nothing);
3. read all the values of each key of `read`, in order.

The result is the list of the 500 read lists, in the order of `read`: an empty
list for a key that is not in the map. A Python adapter returns the lists the
library gives, a Go adapter's result is marshalled with `encoding/json`, and a
Rust adapter's `describe` turns its result into JSON (once per fixture, outside
the timing). The verifier compares every list exactly, values and order, with
the scenario's own answer, computed with a built-in `Map` of arrays when the
fixtures are built. Refused, for every fixture, when the scenario loads:
removals skipped, values sorted or reversed, a value repeated under one key
counted once, only the first or only the last value of a key, keys compared
without regard to case, `null` instead of an empty list for a missing key, and
another fixture's answer.

The removals are done before the reads, not after them, so that the reads show
whether the removals happened: 100 of the 500 reads are removed keys, which
must come back empty. The task has no final key count: `multidict` counts
pairs, not keys, and has no way to count distinct keys but to collect them,
which would be work the other entries do not do.

The 8 cases have 10,000 pairs each and differ in how the pairs fall on keys:
200, 600, 1,000, 3,000 or 8,000 distinct keys, the values spread evenly or
mostly on a few keys (up to about 1,600 values on one key). Keys are
header-like names, query parameters, words with a non-ASCII letter (é, ü, ñ, ø,
ç, ä) and hex ids. Values are short tokens from a pool of 400, and a key often
holds the same value more than once. Of the 100 removals, 90 are distinct
present keys, one of them is removed twice, and 9 were never in the map. Of
the 500 reads, 300 are present keys (always including the present key with the
most values), 100 removed keys, and 100 keys never inserted, most of them a
present key with its first letter upper-cased, which a case-insensitive map
would find.

Accepted differences: the order of keys in the map is never read, so hash
multimaps and insertion-ordered ones are interchangeable. Packages run with
their default settings as installed (default hasher, no reserved capacity).
The map is created inside the call, so construction and growth are measured,
and with 10,000 pairs they are most of every figure. A Rust adapter borrows
the strings from the fixture (`&str` keys and values) and copies each read
list into a new vector, because the map is dropped when the call returns; the
Python and Go entries hand back the list they stored (`multidict`'s `getall`
builds a new list). Each language's strings are its own: Python and Go store a
reference to the fixture's string, as Rust does.

## Entries

- Python `collections.defaultdict` (builtin `python-defaultdict`):
  `defaultdict(list)`, `groups[k].append(v)` for each pair, `groups.pop(k,
  None)` for each removal, `groups.get(k, [])` for each read.
- Go `net/url.Values` (builtin `go-url-values`): `Add(k, v)` for each pair,
  `Del(k)` for each removal, and the map read directly for each key (the
  documented way to get all values of a key; `Get` returns only the first), an
  empty slice for a missing key.
- `multidict` (PyPI): `MultiDict()`, `add(k, v)` for each pair, `popall(k,
  None)` for each removal, `getall(k, [])` for each read.
- `multimap` (Rust): `MultiMap<&str, &str>`, `insert(k, v)` for each pair,
  `remove(&k)` for each removal, `get_vec(&k)` copied into a `Vec` (empty when
  `None`) for each read.
- `ordered-multimap` (Rust): `ListOrderedMultimap<&str, &str>`, `append(k, v)`
  for each pair, `remove_all(&k)` drained (it returns an iterator over the
  removed values) for each removal, `get_all(&k)` collected into a `Vec` for
  each read.

## Left out

- `multidict`'s `CIMultiDict` and Go's `net/http.Header`: they compare keys
  without regard to case (and `Header` rewrites them), so they give a
  different answer for keys that differ only in case. The case-sensitive
  `MultiDict` is the entry.
- JavaScript: there is no multimap in the language. `Map.groupBy` groups a
  whole array at once and keeps the whole items, not values added one by one;
  `URLSearchParams` is a list of pairs, not a hash table, and scans every pair
  on each `getAll` and `delete`. A `Map` of arrays would be the job written by
  hand.
- Ruby: the standard library has no multimap; a `Hash` of arrays would be the
  job written by hand.
- Rust's `std::collections::HashMap<_, Vec<_>>`: there is no way yet to list a
  Rust standard-library entry, and it would be the job written by hand.
- A final count of keys or values: see above.
