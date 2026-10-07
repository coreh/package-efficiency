# Standard JSON document parsing

One operation parses a string of standard JSON text and returns the value. Each
of the 48 inputs is the text of a top-level array of records (1 to 48 records of
varying size) holding strings with escapes and non-ASCII text, safe integers,
fractions, negative numbers, exponents, booleans, nulls, nested objects and
arrays. The text is built once beforehand; building it is not timed.

A correct output is a value structurally equal to the data the text was
generated from: the same arrays, objects, keys, strings and numbers (numbers
compared with `Object.is`). Key order is not compared, and
symbol keys that a package attaches for its own use (for example formatting
metadata) are ignored. Numbers must come back as JavaScript numbers; the inputs
avoid integers beyond 2^53 and fractions longer than 15 significant digits,
so that bigint-aware packages (`json-bigint` returns a BigNumber object for
longer numbers) do not have to return a different type.

Packages run with their default settings as installed. Only the parsing entry
point is called. Packages that read a different format (circular-reference
encodings, streaming parsers that need a stream, file readers) are not
included. Error handling is not exercised: all inputs are valid.

The measured call consumes only the length of the parsed array, so the
parsed value is built in full but not walked again. Standard-library baselines are included for JavaScript (`JSON.parse`), Python
(`json.loads`), Ruby (`JSON.parse`) and Go (`encoding/json`), and Rust is
represented by `serde_json` parsing into its untyped `Value`. Native results
are converted to JSON for the verifier outside measured work.

See [shared methodology](../../README.md) for timing and reproduction.
