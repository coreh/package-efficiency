# Ruby file to its definitions

One operation parses one Ruby source file (95 to 380 lines, 24 files) and
returns the classes, modules and methods it defines. The files are generated
deterministically: modules containing classes (one with a nested module),
instance methods with every kind of parameter, `def self.` methods, predicate,
setter and operator names, endless definitions, `private def`, and bodies with
blocks, heredocs, string interpolation, `case`/`when`, `case`/`in`, `begin`/
`rescue`, lambdas and regular expressions. They stay inside the syntax that
Ruby 3.1 through 4.0 and every parser here read.

## What counts as correct

Every parser has its own tree. Each adapter walks its library's tree, inside
the timed call, into one common shape, and the verifier compares that with
what the generator knows it wrote:

```
[ [kind, path, line, params], ... ]
```

- `kind`: `module`, `class`, `def`, or `sdef` (`def self.name`)
- `path`: the names of the enclosing modules and classes, then the name itself
- `line`: the line, counted from 1, on which the name is written
- `params`: the parameter names of a method in the order written, without
  `*`, `**`, `&` or the trailing `:` of a keyword; `[]` for modules, classes
  and methods without parameters
- the list is in source order: a class before the methods inside it

The fixtures hold lookalikes that only a real parse gets right: `def` and
`class` in comments, in `=begin`/`=end` blocks, in strings, in heredocs, in
regular expressions, in symbols, and after `__END__`. The scenario asserts at
load that a scan of the text for `def`, `class` and `module` does not pass.
Call nodes are not compared, because the parsers disagree on what a call is.
Nothing is accepted as equal beyond the shape itself: every field must match
exactly.

The mapping is one walk over the tree looking for four kinds of node, a few
property reads for each definition and its parameters. It is the same in every
language. Rust builds the list as structs in the call and turns it into JSON
outside it. `@ruby/prism` has no line numbers on its locations, only byte
offsets, so its adapter counts newlines forward from the previous definition;
the fixtures are ASCII, so offsets are characters.

## Packages

Each runs with default options, the way its documentation shows.

- Ruby `Ripper.sexp(source)` (standard library): nested arrays, walked.
- `prism` (gem): `Prism.parse(source)` and a `Prism::Visitor`. The same code
  is bundled with Ruby as a default gem; the standard-library copy is not
  entered separately because the type check has no signatures for it.
- `parser` (gem): `Parser::CurrentRuby.parse(source)`.
- `ruby_parser` (gem): `RubyParser.new.parse(source)`; a parser is built per
  call, as its documentation shows.
- `@ruby/prism` (npm): the WebAssembly build, loaded once by `loadPrism()`;
  `parse(source)` per call and a `Visitor`. It does not start on Bun
  (`wasi.getImportObject` is missing there).
- `lib-ruby-parser` (crate): `Parser::new(source, ParserOptions::default())
  .do_parse()` and a `Visitor`. It also collects tokens and comments, which is
  its normal output.

Not included: no PyPI package or Go module parses Ruby. Syntax-tree helpers,
linters and unparsers built on a parser (`rubocop-ast`, `unparser`) do another
job.

See [shared methodology](../../README.md) for timing and reproduction.
