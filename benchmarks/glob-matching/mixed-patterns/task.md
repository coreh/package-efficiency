# Glob matching, mixed patterns

One operation takes a glob pattern and a list of 240 path strings, compiles the
pattern and tests every path, returning a list of 240 booleans (true = match).
Compilation happens inside the measured call in every adapter, because the
pattern changes between fixtures.

The ratio is one compile per 240 matches, so a figure is mostly matching cost
with one compile spread over it; it is not the cost of a single compile-and-test.
The ratio is a choice of this task, and a different one would shift the ranking
between packages that compile slowly and match fast and the reverse. Two entries
have no separate compile step to amortize: Node's `path.matchesGlob` takes the
pattern string on every call (240 times per operation) and Ruby's
`File.fnmatch?` interprets it on every call. The 240 paths are drawn from a pool
of 340, about 205 distinct per fixture, so some paths repeat within a call. Paths are relative, use `/` and are in memory;
nothing touches the file system.

The 36 fixtures cover `*`, `?`, `**` (leading, middle and trailing), character
classes, brace alternation and plain literals, against paths such as
`src/utils/path.ts` or `packages/core/src/index.js`. Expected answers come from
an independent glob-to-regex oracle in `scenario.mjs`. The check is exact: every
boolean must agree.

Accepted equivalences and exclusions: paths and patterns contain no dotfiles, no
leading `./`, no negation, no extglobs and no Windows separators, since packages
differ there on purpose. Directory-contents patterns are written `dir/**/*`, not a bare trailing
`/**`, because Ruby treats a final `**` like `*`. Patterns use `?` only on ASCII
text, because `globset` matches bytes. Packages run with their default
settings as installed, with one exception: `globset` lets `*` cross `/` by
default, so the crate is built with `literal_separator(true)` to give `*` the
same meaning as in the other packages (a single path segment).

`micromatch` and `anymatch` are both wrappers over `picomatch`: `micromatch.matcher(p)`
returns `picomatch(p)` directly, and `anymatch` builds its matcher with it. As
installed they resolve `picomatch` 2.3.2 from their own dependency ranges, while
the `picomatch` row is the current 4.x, so those three rows are one matching
engine in two versions plus wrapper cost, not three independent implementations.

Entries: `minimatch` (`new Minimatch(p).match`), `picomatch` (`picomatch(p)`),
`micromatch` (`matcher`), `anymatch` (curried `anymatch(p)`), `globset`
(`Glob::compile_matcher`), Node `path.matchesGlob` and Ruby `File.fnmatch?`
(with `FNM_PATHNAME | FNM_EXTGLOB`). The JSR `@cfa/gitignore-parser` was left
out: it implements gitignore rule sets, which are out of scope. Python and Go
standard libraries were left out: Python's `full_match` has no braces and Go's
`path.Match` has no `**`.
