# Relative POSIX path normalization

One operation takes a relative path string that uses `/` separators and returns
it normalized: repeated slashes collapse, `.` segments disappear, and `name/..`
pairs cancel. Leading `..` segments that cannot be cancelled are kept. The 60
cases mix short and deep paths, repeated slashes, `.` and `..` segments, leading
`..`, dotted file names (`.hidden`, `a.b`, `...`), Unicode and spaces, and a few
paths that collapse to nothing.

This is string manipulation only: nothing is resolved against the file system,
no current directory is consulted, and symlinks do not exist. Absolute paths,
backslash separators and Windows drive letters are outside the task, because
not every package handles them.

Outputs must match an independent reference implementation after three
differences, accepted because the packages disagree and each is a valid
normal form, are removed during checking only:

- a trailing slash is ignored (some packages keep it, some drop it);
- a leading `./` is ignored;
- an empty result and `.` are the same result.

Packages run with their default settings as installed. No result is cached
between calls. Rust crates return a fresh owned string on every call.
See [shared methodology](../../README.md) for timing and reproduction.
