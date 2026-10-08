# Pluralize and singularize nouns

One operation takes a list of 40 English nouns in the singular and returns a
flat list of 80 strings: for each noun, its plural, then the singular of that
plural (the noun again). The 32 inputs mix regular nouns (`cat`, `box`, `city`,
`church`, `day`, `photo`) with irregular and invariant ones (`man`, `woman`,
`ox`, `crisis`, `thesis`, `series`, `sheep`, `news`); 6 of every 40 are
irregular, more than in running text, so that an inflector with rules only
cannot pass. Identifier case conversion, message translation, stemming for
search and counting words ("3 cats") are out of scope. No standard library
inflects English nouns, so there are no `builtin/` entries.

## What counts as correct

Each plural must equal the scenario's own table, and the singular of each
plural must be the noun that went in. The output is checked word by word. The
scenario asserts when it loads that three things which do not do the job fail
every fixture: the nouns returned unchanged, an "add s" pluralizer, and an
inflector with only the `s`, `es` and `ies` rules and no irregular noun.

Packages do not agree on every noun, and for those there is no single answer
that every entry would be measured on. The fixtures use only the nouns on
which all 15 entries give the same plural and the same singular back. The
table was built by running every entry on about 300 common nouns (several
kinds of regular ending, `-f`/`-ves`, `-o`, `-is`/`-es`, `-us`/`-i`,
`-um`/`-a`, `-man`/`-men`, `-y` after a vowel, invariant nouns) and keeping
the nouns with one common answer. What was left out, and where the packages
split:

- Words in `-us`, `-um`, `-ix`, `-ex`, `-on` with a Latin or Greek plural
  (`cactus`, `fungus`, `radius`, `criterion`, `phenomenon`, `medium`,
  `curriculum`, `appendix`, `index`, `matrix`): `cactuses` or `cacti`,
  `indexes` or `indices`.
- Irregular native plurals that some packages do not know or get back wrong:
  `goose`, `foot`, `tooth` (several give `gooses`, `foots`, `tooths`), `mouse`,
  `person`, `louse` (some give `mouseice` as the singular of `mice`, or cannot
  singularize `people`), `child`, `fish`, `deer`, `moose`, `salmon`, `trout`,
  `swine`.
- `-f` and `-o` nouns that take `-ves` or `-es` in some books and `-s` in
  others, or that a package gets wrong (`knife`, `wolf`, `leaf`, `hero`,
  `potato`, `tomato`, `video`, `thief`).
- Words whose singular a package cannot recover (`basis` to `base`, `gas` to
  `ga`, `analysis` to `analyasis`, `species` to `specie`, `tax` to `taxis`).

Because most of the irregular nouns split the packages, the irregular share of
the fixtures is the nouns that every package knows. A package that fails the
nouns above is not penalised for them; it is not tested on them.
The fixtures are therefore a fair common core, not a ranking of how
complete a package's irregular list is.

## Entries

- npm `pluralize`, `inflection`, `inflected`; JSR `@wei/pluralize`; crates
  `cruet`, `Inflector`, `pluralizer`; PyPI `inflect`, `inflection`; gems
  `activesupport`, `dry-inflector`, `inflecto`; Go modules `jinzhu/inflection`,
  `gertd/go-pluralize`, `gobuffalo/flect`. Each is called as its documentation
  shows with default options: no custom rules, no counts.
- `inflect` returns `False` from `singular_noun` for a word that is already
  singular; the adapter then keeps the word it was given. It never happens on
  these inputs, but the guard is there for a plural ending in a singular form.
- `pluralizer` has one function, `pluralize(word, count, include_count)`: it
  is called with a count of 2 for the plural and 1 for the singular, as its
  documentation shows.
- Packages with their own state (the `inflect` engine, the `dry-inflector` and
  `go-pluralize` instances) are created once when the adapter loads. Nothing
  is cached between calls.
- Not entered: `compromise` (a natural-language toolkit, much larger than the
  job) and wrappers or forks of an entry here (`pluralize-esm`). Every package that was
  tried installed and ran; none was dropped.
