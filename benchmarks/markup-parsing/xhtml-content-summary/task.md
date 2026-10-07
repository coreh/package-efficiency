# XHTML content summary

One operation takes the text of one XHTML document and returns a summary of
everything in it, `{ elements, attributes, text }`:

- `elements`: the number of elements.
- `attributes`: the total length of all attribute values, after decoding, in
  Unicode code points.
- `text`: the number of Unicode code points of character data, after decoding,
  other than space (U+0020), tab (U+0009), line feed (U+000A) and carriage
  return (U+000D).

Decoding means resolving references: `&amp;`, `&lt;`, `&gt;`, `&quot;`,
`&apos;`, and the numeric forms `&#169;` and `&#x2014;`. A reference counts as
the one character it stands for. Lengths are in code points, not UTF-16 units
or bytes, so `😀` counts as one and `é` as one; that is the unit Python, Rust
and Go count natively, and JavaScript adapters subtract the second half of each
surrogate pair. Comments are not text.

Only the four whitespace characters above are left out of `text`, and all of
them are, wherever they occur. Parsers legitimately differ on whitespace: some
drop whitespace-only text between elements, some trim text, and an HTML parser
moves or drops whitespace around `head` and `body`. Every correct parser agrees
on the remaining characters, so that is what is counted. Attribute values are
counted whole, whitespace included, as parsers do not differ there.

The 40 documents are generated deterministically: a head with meta and link
elements, a header with navigation, then a growing number of sections with
headings, paragraphs with inline markup, lists, images, line breaks and tables,
and a footer. Sizes run from under 1 KB to about 80 KB. The text is valid both
as XML and as HTML: no XML declaration or doctype, no CDATA, only the five
predefined entities and numeric character references, void elements written as
`<br/>`, explicit `html`, `head`, `body` and `tbody` elements, and no element
the HTML parser would move or add. The root has no `xmlns` declaration: XML
parsers disagree on whether a namespace declaration is an attribute (some
report it, some consume it), so it would make `attributes` ambiguous. Documents
contain comments, escaped quotes, ampersands and angle brackets in both text
and attribute values, non-ASCII text and an emoji.

The expected figures come from the generator, not from any parser: it keeps
every string decoded, adds its length to the totals, and escapes it as it
writes the markup. All three figures must equal the expected ones exactly.

## What is measured

Parsing, and reading everything parsed. Every adapter reads each attribute
value and each piece of text through its library's ordinary API inside the
measured call, and adds up the three figures. Event parsers do so in their
handlers; tree and object parsers build their result and the adapter walks it.
That reading is the job, for every entry alike. It is what makes the entries
comparable: a parser that only finds tag boundaries until asked, and decodes
attributes or text on demand, is asked for all of them, as the parsers that
decode eagerly or build a tree already do the work.

Libraries that need a parser object use a fresh one per call, as their
documentation shows. Packages run with default settings as installed: no
namespace handling, no validation options, no whitespace trimming beyond what
the library does by default. The exceptions, where a package does not deliver
the content otherwise, are stated in that adapter's notes:

- `fast-xml-parser` is given `ignoreAttributes: false`, as it drops attributes
  by default, and `htmlEntities: true`, as by default it leaves numeric
  character references undecoded. By default it also turns text that looks like
  a number into a number; the adapter measures those through `String()`, and no
  number in the fixtures changes when round-tripped.
- `quick-xml` reports a reference in text as an event of its own and leaves
  resolving it to the caller, so the adapter calls the crate's own resolving
  functions for each one. Its attribute values are decoded by the crate.

## Accepted differences

- HTML parsers (`parse5`, `htmlparser2`, `deno-dom`) and XML parsers do
  different work on the same bytes; the HTML5 tree builders run the full
  tree-construction algorithm. They are compared because for this input they do
  the same job and give the same answer.
- Event parsers never hold the whole document; tree parsers do, and their
  memory figure includes the tree.
- JavaScript adapters scan each attribute value once to count code points,
  where Python has the length at hand; the scan is small beside parsing.
- `roxmltree` and `quick-xml` borrow from the input where no decoding is
  needed; others allocate each string.

## Left out

- `xmlparser` (cargo) is a tokenizer that yields raw slices of the input. It
  does not resolve entity or character references in text or attribute values
  and offers no function to do so, so it cannot deliver decoded content; the
  adapter would have had to implement the decoding itself.

This is parsing, not DOM manipulation, serialization or sanitizing. Documents
are preconstructed in memory.
