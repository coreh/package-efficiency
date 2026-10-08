# Expand glob patterns against a tree

One operation is given the absolute path of a directory and a list of glob
patterns, and returns, for each pattern in order, the list of files under the
directory that the pattern matches. Each pattern is expanded by its own call to
the library (a loop over the patterns, in every language alike), so every call
walks the tree again.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The directories are real. The harness
creates them in the task's scratch directory before each adapter process
starts: nothing may be remembered from one call to the next.

There are four trees, and a round expands each the same number of times:

- `app` (14 patterns): a source project of 10 packages with nested source,
  test and documentation directories of 6 to 47 files, hidden files
  (`.gitignore`, `.env`, `.eslintrc.json`), hidden directories (`.config`,
  `.github`, `.cache` with `.js` files in it), an empty directory, and names
  with spaces and non-ASCII characters (2,408 files).
- `wide` (3 patterns): three directories of 400 files each, with a hidden file
  and a hidden directory (1,202 files).
- `deep` (3 patterns): a chain of 40 directories with five files at each
  level, and a hidden file and a hidden directory at one level (202 files).
- `modules` (5 patterns): 90 installed-package folders, some under a scope
  directory, with 5 to 17 files each, a few `.npmignore` files and `.bin`
  directories (1,238 files).

The patterns use only what every library shares: `*`, `?`, `[a-m]` and `**` as
a whole path segment (`**/*.ts`, `src/**/*.tsx`, `**/test/*.spec.*`,
`packages/*/package.json`, `**/index-?.ts`, `**/[a-m]*.css`, `docs/*/*.md`,
`**/.gitignore`, `.config/*.json`, `l00/l01/**/data.json` and so on). There is
no brace expansion (Python's `glob` and Rust's `glob` do not have it) and no
negation. Every pattern ends in a name that only files have, so no directory is
ever a match. There are no symbolic links, no unreadable directories and no
names that differ only in case (macOS is case-insensitive, and some libraries
follow the platform).

## The dot-file rule

A name that starts with a dot is **hidden**. `*`, `?`, `[..]` and `**` never
match a hidden name or go into a hidden directory; only a segment of the
pattern that itself starts with a literal dot does (`**/.gitignore` finds
`.gitignore` in every directory that is not hidden, `.config/*.json` finds the
files of the hidden directory `.config`, and `**/*.json` finds none of the
`.eslintrc.json` or `.config/settings.json` files). This is what Node's
`fs.globSync`, `glob`, `tinyglobby`, `fast-glob`, `globby`, Python's `glob`,
Ruby's `Dir.glob` and the shell do by default.

Other packages follow the opposite convention: a wildcard matches a hidden
name like any other (Rust's `glob` and `globwalk`, Go's `doublestar` and
`zglob`, Deno's `@std/fs`). Both are accepted. A result must follow one
convention for every pattern of a fixture, not a mix, and the trees hold
hidden names so that the two answers differ. A package of the second kind
returns more paths for some patterns, so it does a little more work in this
task.

## What is checked

The result must hold, for each pattern, every matching file exactly once and
nothing else. The expected lists come from a small reference matcher in
`scenario.mjs` written from the rule above, applied to the list of files that
were declared, not read from the disk. A missing file, a hidden file that
should not be there, an extra or repeated path, or a directory fails. Two
things are forgiven because they are the same answer in another spelling: the
order of each list, and whether a path is absolute or relative to the root
(a leading `./` is ignored too).

The result is a list of lists of path strings in every language. A package that
returns entry objects has its adapter read the path of each inside the measured
call (`@std/fs`). Rust collects the paths and converts them to JSON once per
tree, outside measured work. No adapter sorts or filters. The measured loop
reads only the number of lists.

Packages run with their default options, used as their documentation shows.
Where a library takes a base directory (`cwd`, `root`, `root_dir`, `base`,
`os.DirFS`) the adapter passes the tree's root; where it takes none (Rust
`glob`, `globwalk`, Go `zglob`) the root is joined to the pattern inside the
call (Rust escapes it with `Pattern::escape`).

## What the figure means

The trees were written a moment before and are in the operating system's cache,
for every entry alike, so no disk is read. CPU time is the process's user and
system time. The system part is the kernel listing directories, and it is most
of the figure: every entry on a machine pays about the same for the calls
nobody can avoid, so classes are closer together here than in a task on memory.
A library that walks with several threads (`zglob`) is counted for all of them.
A cache a library keeps by itself stays; none of those listed keeps one.

## Packages that do not pass

Default options are entered even where they do not give the answer; each is
recorded as not passing, and where an option fixes it a variant sits beside it.

- `wcmatch` (PyPI): without the `GLOBSTAR` flag `**` means `*`. Variant
  `wcmatch-globstar` passes.
- `bmatcuk/doublestar` (Go): `*` and `**` match hidden names. Variant
  `bmatcuk-doublestar-nohidden` (`WithNoHidden()`) passes.
- `glob` (crate): `*` and `**` match hidden names. Its option
  `require_literal_leading_dot` fixes that but also stops `**/.gitignore` from
  finding anything, so even that fails and no variant is entered.
- `globwalk` (crate) and `mattn/go-zglob` (Go module): hidden names match and
  there is no option for it.
- `@std/fs` (JSR): `*` and `**` match hidden names, and there is no option for it.

## Packages

- npm: `glob`, `tinyglobby`, `fast-glob`, `globby` (each with `cwd`).
- JSR: `@std/fs` (`expandGlobSync`).
- Rust: `glob`, `globwalk`.
- PyPI: `wcmatch`, and `glob` of the standard library.
- Go: `bmatcuk/doublestar`, `mattn/go-zglob`.
- Standard libraries: `fs.globSync` (Node, Bun and Deno each have their own),
  Python `glob.glob`, Ruby `Dir.glob`.

Left out:

- Go's standard library: `filepath.Glob` has no `**`, and a `WalkDir` with
  `path.Match` would be the job written by hand. There is no Go builtin entry.
- RubyGems: the only way to glob that gems offer is `Dir.glob` itself or a
  wrapper over it (`rake`'s `FileList`), so there is no gem entry.
- Not in any fixture: a leading `@` followed by `?` in a directory segment
  (`@scope-?/*`): `fast-glob` and `globby` (micromatch) return nothing for it
  while every other library agrees, and `zglob` cannot take a `[..]` in a
  directory segment. Neither is a case the task needs.
- Also not used: brace expansion, negation and extglobs, which not every
  library has.
