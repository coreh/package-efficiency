# Resolve specifiers to files in a node_modules tree

One operation is given a base directory and a list of specifiers (13 to 19 of
them) and returns, for each specifier in order, the absolute path of the file
it resolves to, as Node's `require` would find it from that directory.

This is a task on the file system (see "Tasks on the file system" in the
[shared methodology](../../README.md)). The project is real: the harness
creates it in the task's scratch directory before each adapter process starts
(220 files in 165 directories, with about 65 packages in `node_modules` folders), and
nothing may be remembered from one call to the next.

There are four cases, one per base directory, and a round runs each the same
number of times:

- `src`: relative files with and without extension, a directory with an
  `index.js`, a package folder whose `main` has no extension, a `.mjs` file,
  a dot directory, `..` paths, and bare packages from a nearer and a farther
  `node_modules`.
- `src/lib/deep/a/b/c`: a base five levels down; `..` chains, a package in a
  nearer `node_modules` that has a `main`, scoped packages, a `main` that
  names a `.json` file without extension, a `main` that names a directory,
  a `main` that names a file that is not there (the package's `index.js`
  is used) and a lone `node_modules/single.js`.
- `test/fixtures`: a package of the nearest `node_modules`, `package.json`
  and `.json` files addressed directly, subpaths of packages.
- `src/widget`: `.`, `..`-relative names, a subpath that is a directory.

The fixture uses the classic algorithm: files, directories, `main`, `index`,
extensions `.js`, `.json` and `.node`, `node_modules` up the tree. It has no
`exports` or `imports` fields, no symbolic links and no specifier that fails.

## What is checked

The result must be a list with one string per specifier, in the order of the
specifiers, and each string must be exactly the expected absolute path. Nothing
is forgiven: a path to another existing file, a relative path, a missing
extension or a result for the wrong specifier fails.

## What the figure means

The files are in the operating system's cache, for every entry alike, so no
disk is read. CPU time is the process's user and system time, so the
kernel's part (`stat`, `readFile`) is in it. How many system calls a resolver
makes is its own choice.

Packages run with their default options, used as their documentation shows.
Caching is the point to read carefully:

- `enhanced-resolve` caches file system answers in a `CachedInputFileSystem`
  and keeps results in the resolver; `unrs-resolver` caches in its
  `ResolverFactory`. Both adapters create that object inside every call, so
  each call starts with an empty cache and the figure is a resolver doing the
  work, not a resolver answering from memory.
- Node's own resolver (`require.resolve` through `createRequire`, and
  `resolve-from`, which calls `Module._resolveFilename`) keeps a path cache
  and a package.json cache in the `Module` class. It is not an object the
  adapter owns and cannot be dropped without private API, so it stays: after
  the first call these two entries answer from memory and cost mostly a hash
  lookup. Read them as "Node as it runs", not as an uncached resolver.
- `resolve` has no cache.

## Packages

- npm: `resolve-from`, `resolve`, `enhanced-resolve`, `unrs-resolver`. `resolve`
  with its default options does not try `.json` (its `extensions` is `['.js']`),
  so `./data` fails and the entry is recorded as not passing; the variant
  `resolve-extensions` passes `extensions: ['.js', '.json', '.node']`.
- Standard library: Node's `require.resolve` with `createRequire`. Bun and Deno
  run the same adapter with their own implementations. Python, Ruby and Go have
  no resolver for this job (their import systems resolve other things).

Left out: `eslint-import-resolver-node` (a wrapper over `resolve`),
`tsconfig-paths` (maps `paths` from a tsconfig, a different job),
`resolve-pkg-maps` (only reads `exports` maps, does not touch the disk).
No JSR package or crate is entered: the brief lists none, and `oxc_resolver`
would have to be added by a decision.
