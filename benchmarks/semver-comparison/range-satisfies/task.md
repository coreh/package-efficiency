# Semantic version range test

One operation takes a pair `[version, range]` of strings, parses both and returns
a boolean: does the version satisfy the range? Parsing is part of the measured
call. The task adds no cache of its own, but npm `semver` keeps its own cache of
parsed ranges, so after the first pass over the fixtures its range parse is a
lookup; `@std/semver` and the Rust crate parse the range every time. That is
how the packages behave when the same ranges are checked repeatedly, as they
are in a dependency resolver.

The 84 cases use full `major.minor.patch` versions, some with prerelease tags
(`-beta.2`) or build metadata (`+build.5`), and single-comparator ranges with a
full version: `^`, `~`, `>=`, `>`, `<`, `<=` and `=`, including `0.x` and `0.0.x`
caret ranges. Expected results come from an independent oracle in `scenario.mjs`.

Scope is limited to the syntax every package shares. Compound ranges (`||`,
space or comma separated), partial versions (`1.x`), hyphen ranges and
dependency resolution are outside the task, because Cargo's flavour and npm's
differ there. Prerelease versions never satisfy a range whose comparator has no
prerelease, which all three implementations agree on; prerelease versions are
tested only against such ranges. Build metadata is ignored in precedence.

Packages run with default options as installed. Rust crates receive the already
parsed JSON fixture and return a bool; JavaScript adapters receive the same array.
`semver-parser` and the other JSR packages listed for the category do not
evaluate ranges, so they are left out.
