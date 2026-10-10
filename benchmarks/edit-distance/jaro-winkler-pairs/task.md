# Jaro-Winkler similarity of string pairs

One operation takes an array of 200 string pairs and returns an array of the
same length holding the Jaro-Winkler similarity of each pair, in order, as
floats between 0 and 1. The similarity is the standard one: Jaro similarity
(matches within a window of half the longer string's length minus one,
transpositions halved), plus a bonus of 0.1 times the length of the common
prefix, up to 4 characters, times the remaining distance to 1. These are the
defaults of every entry; no option is passed.

The six cases are built deterministically, 1,200 pairs in all, each string 3
to 28 characters:

- person names ("given family") with one to three typos (a dropped, doubled,
  swapped, substituted or inserted letter), as in record linkage; the first
  case starts with Winkler's published examples (`martha`/`marhta`,
  `dwayne`/`duane`, `dixon`/`dicksonx`), an identical pair and a pair sharing
  six leading characters;
- surnames alone, a quarter with the first letter changed (no common prefix);
- identifiers and command words, some sharing a long prefix (a word against
  the same word with another ending), so the cap at 4 matters;
- street addresses with a house number, with typos or another number;
- names identical, with the two words swapped, or with three to six typos;
- names with accented Latin letters (`josé`, `müller`, `østergaard`,
  `weiß`): every character is a code point below U+0100 and every pair has at
  least one that is not ASCII.

The first five cases are printable ASCII. Every prefix length from 0 to 4
occurs at least 20 times, and at least 20 pairs that are not identical share
more than 4 leading characters.

## What counts as correct

The scenario computes every expected value with its own Jaro-Winkler
reference over code points, checked when it loads against the published
values above and strsim's doc example. A correct output is an array of 200
numbers, each within 1e-9 of the reference. The tolerance only absorbs the
order of floating-point operations: rapidfuzz and Levenshtein differ from the
reference by at most 1.1e-16 on these fixtures, while every pair that is not
identical is at least 0.01 below 1, so a missing prefix bonus moves a value by
0.001 or more.

When the scenario loads it proves, for every case, that the check refuses:
plain Jaro (no prefix bonus), the distance `1 - similarity`, a prefix scale of
0.25, matching without the window, values rounded to three decimals, a missing
value, another case's values and the input returned as it came; on the ASCII
cases a prefix that is not capped at 4; and on the Latin-1 case the similarity
of the UTF-8 bytes instead of the code points.

Pairs left out of the fixtures, because the packages may differ on them for
reasons that are not the job:

- Jaro similarity below 0.72. Every entry applies the prefix bonus only above
  0.7, but packages differ on whether there is such a threshold and whether it
  is `>` or `>=`; the margin keeps that, and rounding at the boundary, out.
- Pairs where matching from the second string gives other matches or
  transpositions than matching from the first. Some implementations put the
  shorter string first (`DidYouMean`), others keep the order given; greedy
  matching can differ between the two on rare pairs.
- Pairs with an odd number of out-of-order matched characters, where halving
  the transpositions needs a rounding rule (every entry seen floors it, but it
  is not specified).
- Characters above U+00FF. Packages that work on code points (all the entries
  here) and on UTF-16 units or bytes would disagree there; inside Latin-1
  every code point is one character in every representation the entries use.

Packages run with their default settings, as installed. Each adapter calls
the package's two-string function once per pair and collects the results; the
loop and the output list are in every adapter alike. No result is cached
between calls, and strings are created before timing.

## Entries

| Entry | What the adapter calls |
| --- | --- |
| `builtin/ruby-did-you-mean` | `DidYouMean::JaroWinkler.distance(a, b)` from the `did_you_mean` default gem for each pair; despite its name it returns the similarity. |
| `rubygems/jaro_winkler` | `JaroWinkler.similarity(a, b)` (`JaroWinkler.distance` in older releases, which also returned the similarity), default options (weight 0.1, threshold 0.7, no case folding, no adjusting table). |
| `cargo/strsim` | `strsim::jaro_winkler(a, b)` for each pair, collected into a `Vec<f64>`; `describe` turns it into JSON. |
| `pypi/rapidfuzz` | `rapidfuzz.distance.JaroWinkler.similarity(a, b)` with no `prefix_weight`, `processor` or `score_cutoff`. |
| `pypi/levenshtein` | `Levenshtein.jaro_winkler(a, b)` with no `prefix_weight`. |

The package entries are written separately; this list says what each is to
call.

## Left out

- Python, Go and JavaScript have no Jaro-Winkler in their standard libraries
  (Python's `difflib.SequenceMatcher.ratio` is another measure).
- Plain Jaro and Levenshtein, which several of these packages also offer: other
  jobs (`levenshtein-pairs` measures Levenshtein).
- Rust's standard library: there is no `builtin` path for Rust, and it has no
  Jaro-Winkler anyway.

See [shared methodology](../../README.md) for timing and reproduction.
