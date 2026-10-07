# Glob matching, precompiled include set

This is the filter job: a build tool or watcher has a fixed list of include
globs and asks, for each path, "does any of them match?". Unlike
`mixed-patterns`, which compiles a new pattern in every call, here the ten
patterns never change and are compiled once when the adapter loads, outside the
measured call. The measured work is matching only, against a set rather than a
single pattern. The one exception is the Ruby entry: `File.fnmatch?` has no
compile step, so it interprets the patterns, brace expansion included, for
every path in every call, and its figure includes that work.

One operation takes `{ paths }`, a list of 250 relative path strings using `/`,
and returns a list of 250 booleans: true when the path matches at least one of
the ten patterns. Nothing touches the file system.

The patterns (the same in every adapter):
`src/**/*.{ts,tsx}`, `**/*.test.js`, `docs/**/*.md`, `packages/*/src/**/*.ts`,
`*.json`, `assets/img/*.{png,jpg,svg}`, `**/__tests__/**/*`, `lib/**/index.js`,
`**/file-?.txt`, `config/[a-c]*.yml`.

The 36 fixtures draw from a generated pool of 756 paths (27 directories by 28
file names: source trees, packages, docs, assets, config, tests, node_modules,
build output), with
each fixture containing both matches and non-matches. Expected answers come
from an independent glob-to-regex oracle in `scenario.mjs`; every boolean must
agree, and every fixture must contain at least one true and one false, so an
adapter returning a constant fails.

How each package handles a set: `picomatch` and `micromatch` (`matcher`) and
`anymatch` take the array of patterns and return one function; `minimatch` has
no set type, so the adapter holds an array of `Minimatch` objects and tests them
in order until one matches; `globset` uses `GlobSet`, which matches all
patterns together, built with `literal_separator(true)` so `*` stays inside a
path segment as in the other packages (its default lets `*` cross `/`); Ruby
`File.fnmatch?` has no compile step and is tried per pattern with
`FNM_PATHNAME | FNM_EXTGLOB` (without them `*` crosses `/` and braces are
literal). `micromatch` and `anymatch` wrap `picomatch`
(resolving 2.3.x as installed, while the `picomatch` row is 4.x), so they are
one engine in two versions plus wrapper cost. Packages run with their default
settings as installed, except for the `globset` option and the Ruby flags
above, which the patterns need to mean the same thing; both entries are marked
as using non-default options.

Left out: Node `path.matchesGlob` (like the Ruby entry it works from the pattern
text on every call, and it takes one pattern, not a set); the JSR `@cfa/gitignore-parser`
(gitignore rule sets are out of scope); Python and Go standard libraries
(no `**` or braces). Paths contain no dotfiles, negation, extglobs or Windows
separators, and `?` is only used on ASCII text.
