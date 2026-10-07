# Legacy Rust symbol paths

One operation demangles one symbol name, a string, into its readable form.
The 64 cases are Rust legacy-mangled symbols (`_ZN` + length-prefixed
segments + `17h<16 hex digits>E`), the format found in most binaries built
by stable rustc. They have the shapes found in such a binary:

- plain paths (`tokio::runtime::…::Worker::run`), 8 of the 64;
- trait implementations (`<alloc::vec::Vec<u8> as core::fmt::Debug>::fmt`) and
  impl blocks (`<impl Trait for Type>::method`);
- generic types and functions (`Vec<T,A>::push`, `core::ptr::drop_in_place<…>`),
  with references, raw pointers, slices, arrays, tuples, lifetimes and
  `dyn A + B` in the type arguments;
- closures (`{{closure}}`, sometimes nested) and the `call_once{{vtable.shim}}`
  shim.

In the mangled form these are written with rustc's escapes: `..` for `::`,
`$LT$`, `$GT$`, `$RF$`, `$BP$`, `$LP$`, `$RP$`, `$C$`, and `$u20$`-style hex
escapes for spaces, braces, brackets, `;`, `'` and `+`, with a leading
underscore on a segment that starts with an escape. 56 of the 64 symbols
contain escapes. Symbols are 44 to 240 bytes long. The module, type, trait and
method names are real ones, but they are combined by a fixed pseudo-random
sequence, so a given path need not exist in any crate.

The expected output is the readable segments joined by `::` followed by
`::h<hash>`, which is what `rustc_demangle::demangle(s).to_string()` prints:
its default `Display` keeps the trailing hash. Each output must equal the
expected string exactly, so an adapter that returns its input, a constant,
leaves an escape undecoded, or drops the hash fails. The scenario builds each
symbol from its readable form, so the expected strings do not come from any
demangler.

Scope: legacy symbols only. v0 (`_R`) symbols, which rustc-demangle also
handles, are not measured. rustc writes `-` and a lone `:` as `.`, which no
demangler can undo, so the fixtures contain neither (no `fn() -> T` types).
Each result is a fresh owned String, and parsing the symbol is inside the
timed call. Packages run with default settings as installed.

This task has one entry, `rustc-demangle`, so there is nothing to rank it
against here. `cpp_demangle` is not included: it is a C++ Itanium demangler, a
different tool, and the two could only be compared on plain identifier paths,
which legacy Rust symbols share with Itanium nested names.

See [shared methodology](../../README.md) for timing and reproduction.
