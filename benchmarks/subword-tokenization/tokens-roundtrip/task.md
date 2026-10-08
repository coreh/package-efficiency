# Encode and decode with cl100k_base

One operation takes a text and returns the token ids of the `cl100k_base` BPE
vocabulary (the one of GPT-3.5 and GPT-4) together with the text decoded back
from those ids: `{ ids, text }`. The 32 fixtures are texts of 14 to 702 tokens,
built without randomness from fixed passages: English, Portuguese, German,
Spanish, Russian, Japanese, Chinese, Korean and Arabic prose; emoji, symbols,
numbers and dates; JavaScript, Python, Go, Rust, JSON, SQL, HTML and CSS; runs
of white space, tabs, blank lines, `\r\n`, repeated characters and mixed case;
and eight longer texts that join three of these.

The encoder is created once, when the adapter loads, as every package's
documentation shows (loading the vocabulary of 100,000 entries is not part of
the operation). Each call then encodes the text and decodes the ids it got.
The texts contain no special-token spelling such as `<|endoftext|>`, which
some packages refuse and others encode as one id.

## What counts as correct

The ids must equal the recorded ones exactly, and the decoded text must equal
the input exactly. The ids may be an array or a typed array; the text must be
a string. Nothing else is accepted: there is no tolerance, because a
vocabulary and its pre-tokenization pattern fix the ids.

The vocabulary is too large for a reference inside the scenario, so the ids
were recorded once. They were produced by five independent implementations,
which agree on every fixture: `gpt-tokenizer` (pure JavaScript), `js-tiktoken`
(a JavaScript port), `tiktoken` (the Rust core compiled to WebAssembly),
`tiktoken-rs` and `bpe-openai` (both Rust, the latter with its own
pre-tokenizer rather than OpenAI's regular expression). The recorded ids are
those, as of the versions the scripts installed on 2026-10-07. Every fixture
round-trips. The scenario also asserts at load that raw UTF-8 bytes as ids, a
truncated id list and a damaged text are rejected.

## Packages

Each package is used the way its documentation shows, with default options,
the `cl100k_base` encoding chosen by name or by import path.

- `gpt-tokenizer`: `encode`, `decode` from `gpt-tokenizer/encoding/cl100k_base`
  (the package's top-level default is `o200k_base`, a different vocabulary).
- `js-tiktoken`: `new Tiktoken(cl100k_base)` from `js-tiktoken/lite`, with the
  ranks from `js-tiktoken/ranks/cl100k_base`; `encode`, `decode`.
- `tiktoken`: `get_encoding('cl100k_base')`; `encode` gives a `Uint32Array`,
  `decode` gives UTF-8 bytes, which the adapter turns into a string with
  `TextDecoder`, as the documentation does. That conversion is part of the call.
- `tiktoken-rs` (Rust): `cl100k_base_singleton()`, `encode_with_special_tokens`, `decode`.
- `bpe-openai` (Rust): `cl100k_base()`, `encode`, `decode`.

Different work for the same job is reported, not hidden: `bpe-openai` uses a
different algorithm (an exact, linear-time byte-pair encoder) from the merge
loop of the tiktoken family, and `tiktoken` crosses a WebAssembly boundary and
copies bytes in and out on every call.

## Not included

- PyPI `tiktoken` downloads the vocabulary from the network on first use, so
  it is not deterministic offline and is left out; so is Go `tiktoken-go` in
  its default form, for the same reason. The npm and Rust packages carry the
  vocabulary.
- PyPI `tokenizers` and `sentencepiece` and the crate `tokenizers` need a model
  file and have no `cl100k_base` of their own; they are another task.
- `@wangb/vibrato-deno` (JSR) is a Japanese morphological analyzer, not a
  subword encoder.
- There is no standard-library tokenizer in JavaScript, Python, Ruby or Go.

See [shared methodology](../../README.md) for timing and reproduction.
