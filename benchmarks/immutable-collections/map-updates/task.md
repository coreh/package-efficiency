# Persistent map updates

One operation takes `{ entries, ops, keep, lookups }`. `entries` is a JSON object of 200 to
1,000 string keys with integer values: version 0 of the map, which the operation builds in one
step with the library's own constructor from a mapping (or, where the library has none, one
insert per entry on its empty map). It then applies 100 to 500 `ops` in order, each to the
version the previous op produced, each giving a new version: `["set", key, value]` adds the key
or replaces its value, and `["delete", key]` removes it (the key is always present when a delete
runs). About half the ops replace a value, a quarter add a key (some brand-new, some deleted
earlier) and a quarter delete one. `keep` names the versions to keep, version *k* being the map
after *k* ops: `[0, half, last]`. Only those three are held; the others may be dropped as soon
as the next one exists.

After the last op, the operation reads every key of `lookups` (about 60: keys of version 0, keys
added by the ops, keys deleted by the ops and 10 keys that never existed) in each kept version.
A correct result is `[[size, values], …]`, one pair per kept version in the order of `keep`: the
number of keys in that version and the value of each lookup key in it, `null` where the key is
absent. Expected results are computed in the scenario with one plain `Map` copy per version and
compared exactly. Version 0 must still read as it was built, so a map changed in place fails.
Deletes ignored, the middle and last versions swapped, a size off by one, an absent key read as
`0` or `undefined` instead of `null`, and another fixture's answer are also refused; the scenario
asserts this for every fixture when it loads. About one value in twenty is `0`, so a falsy check
in place of a presence check fails too.

The 40 cases use four key styles: zero-padded record ids (`user:0004217`), words of 1 to 24
letters and digits, file paths that share long prefixes, and keys with non-ASCII letters
(`café-…`, `ключ-…`). The last two cases are small hand-checked ones: an empty start built
entirely by sets, and a map that is empty by its middle version and is then refilled, with a key
deleted and set again and the value 0 read back.

Building version 0, the whole update sequence and the lookups are one timed call. Packages run
with their default settings as installed and are used the way their documentation shows; each
step's new version is what the next step starts from, and nothing is cached between calls. The
lookups are mapped to the common shape (a list of values, `null` for absent) inside the call.

Different work for the same job: `pyrsistent`'s `PMap`, `rpds-py`'s `HashTrieMap` and
`lann/ps`'s `Map` are hash tries and `go-immutable-radix` is a radix tree; all four share
structure, so an update copies a path of a few nodes. `frozendict` and `immutabledict` copy the
whole dict on every `set` and `delete`, Immer copies the `Map` on every `produce` (and freezes
the result by default), and so do the standard-library baselines, so an update costs
time in proportion to the size of the map. That is each package's normal way and it is measured
as it is; findings at 1,000 keys do not extend to much larger maps, where the gap grows. The
radix tree also keeps its keys in order, which the hash tries do not.

## Entries

- JavaScript `Map` copy (builtin `js-map-copy`): `new Map(Object.entries(entries))`, then
  `new Map(previous)` and `set` or `delete` per op; `get` with `?? null` for the lookups.
- Python `dict` copy (builtin `python-dict-copy`): `dict(entries)`, then `copy()` and an item
  assignment or `del` per op; `dict.get` for the lookups.
- Ruby frozen `Hash` (builtin `ruby-hash-copy`): a frozen `dup` of `entries`, then
  `merge(k => v)` or `except(k)`, frozen, per op; `Hash#[]` for the lookups.
- Go `maps.Clone` (builtin `go-maps-clone`): `maps.Clone` of the decoded entries, then
  `maps.Clone(previous)` and an assignment or `delete` per op; values stay as decoded JSON
  numbers, an absent key reads as `nil`.
- `pyrsistent` (PyPI): `pmap(entries)`, then `set` and `remove`; `get` for the lookups.
- `rpds-py` (PyPI): `HashTrieMap(entries)`, then `insert` and `remove`; `get` for the lookups.
- `frozendict` (PyPI): `frozendict(entries)`, then `set` and `delete`, each returning a new
  `frozendict`; `get` for the lookups.
- `immutabledict` (PyPI): `immutabledict(entries)`, then `set` and `delete`, each returning a
  new `immutabledict`; `get` for the lookups.
- Immer (npm): `enableMapSet()` once at load; version 0 is one `produce` on an empty `Map`
  that sets every entry, then one `produce` per op whose recipe calls `set` or `delete` on the
  draft; `get` with `?? null` for the lookups.
- `github.com/lann/ps` (Go): `ps.NewMap()` and one `Set` per entry, then `Set` and `Delete`;
  `Lookup` for the lookups and `Size` for the size.
- `github.com/hashicorp/go-immutable-radix` (Go): `iradix.New()` and the entries inserted
  through one `Txn` (`Insert`, then `Commit`), then `Insert([]byte(k), v)` and
  `Delete([]byte(k))` on the tree, each returning a new tree; `Get` for the lookups and `Len`
  for the size.

## Left out

- `frozenlist` (PyPI): a list that is mutable until frozen and has no update that returns a new
  version; not a map either.
- Bulk updates (`update` with a mapping, transients, evolvers): the job applies one update per
  version, so every entry is compared on one shape of work.
