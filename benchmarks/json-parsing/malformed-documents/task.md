# Rejecting malformed JSON

One operation takes a string and either parses it or rejects it. Each of the 48
inputs is a paged API response (an object with a page number, a list of 3 to 25
records and a next link). Forty are corrupted at a varying position: truncated,
a trailing comma, a single-quoted key, an unquoted key, trailing garbage after
the document, a missing comma, a missing colon, or a broken literal (`nul`).
The other eight are valid JSON, the smallest documents (3 records, about 4% of
the text): they are there so that an adapter cannot pass by refusing
everything, and are kept small so that the figure is the cost of rejecting
text. A parser still reads a malformed document up to the fault, so that
reading is part of the cost. Parsing valid text is the `standard-documents`
task. The text is built once beforehand; building it is not timed.

A correct output is the parsed value for a valid input, structurally equal to
the data the text was generated from (numbers compared with `Object.is`, key
order ignored), and `null` for a malformed input. Each adapter catches its
library's parse error inside the call and returns null (None, nil, an `Option`
in Rust), the same way in every language. The error object itself is thrown
away, which is the point: this task measures what a package costs when it
rejects text, not only when it accepts it. Packages that build richer errors
(a position, a line and column, a code frame) pay for that here, and plain
parsers do not. Which error message a package produces is not compared.

Packages run with their default settings as installed. Only the parsing entry
point is called. Packages that read a different format (circular-reference
encodings, streaming parsers, file readers) are not included. The measured call
consumes only whether the result is null, so a parsed value is built in full but
not walked again. Standard-library baselines are included for JavaScript
(`JSON.parse`), Python (`json.loads`), Ruby (`JSON.parse`) and Go
(`encoding/json`), and Rust is represented by `serde_json` parsing into `Value`.
These are the same entries as in `standard-documents`.
Native results are converted to JSON for the verifier outside measured work.

See [shared methodology](../../README.md) for timing and reproduction.
