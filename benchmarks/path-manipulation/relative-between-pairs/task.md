# Relative path between two absolute paths

One operation takes a pair `[from, to]` of absolute POSIX path strings and
returns the relative path that leads from `from` to `to`: shared leading
segments are dropped, each remaining segment of `from` becomes `..`, and the
remaining segments of `to` are appended. The 60 pairs mix identical paths,
ancestors and descendants, siblings, paths sharing only the root, deep and
shallow paths, dotted names (`.hidden`, `a.b`, `...`), Unicode and spaces.

All inputs are already normalized (single `/` separators, no `.` or `..`
segments, no trailing slash), because not every package normalizes first.
Nothing touches the file system and no current directory is consulted.

Outputs must match an independent reference implementation. One difference is
accepted and removed during checking only: an empty result and `.` are the same
(identical paths). Anything else, including wrong `..` counts or a result equal
to `to`, fails.

Packages run with their default settings as installed. No result is cached
between calls. Rust crates return a fresh owned string on every call. Python,
Ruby and Go use their standard-library relative-path functions on the same
pairs.
See [shared methodology](../../README.md) for timing and reproduction.
