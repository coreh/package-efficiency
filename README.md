# Package Efficiency Labels

Compute and RAM keep getting pricier. Switching languages, runtimes and
libraries has never been cheaper.

[package-efficiency.org](https://package-efficiency.org) gives packages
energy-label style classes for CPU, memory and type-check cost, measured per
task across ecosystems (npm, JSR, crates.io, PyPI, RubyGems, Go modules) and
runtimes. The best result for a task, in any language or runtime, sets class A,
so a class means the same on every page. A function built into a runtime is
also an entry, so you can compare a package with no package.

It is semi-scientific, inspired by the energy efficiency labels used in the
EU and elsewhere, and not affiliated with any package or runtime:

- A task shows how a package does that one job on those inputs, not how it
  does everything.
- Packages run with their default settings unless an entry says otherwise.
- AI coding agents wrote the adapters; reviewed ones carry a mark.
- Every package is installed at a release at least seven days old.
- CPU time and memory are measured, not energy.

## Running it

```sh
npm run setup                                   # install the pinned toolchains and packages
npm run measure -- deep-equality/nested-json    # measure one task
npm run build && npm run preview                # build the site and serve it locally
```

[benchmarks/README.md](benchmarks/README.md) covers setting up a machine
(macOS or Linux), how results are measured, and how to write tasks and
adapters.
