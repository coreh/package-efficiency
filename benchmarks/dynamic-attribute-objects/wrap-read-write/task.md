# Wrap a nested hash, read and write by method

One operation is given a nested hash of 1,000 keys (strings, integers, floats,
booleans, null, short integer lists, and hashes nested up to 8 levels deep) and
a list of 250 steps. It wraps the hash in the package's attribute object, then
carries out the steps in order, each by method call along the key path
(`obj.a_1.b_2.c_3` to read, `obj.a_1.b_2.c_3 = v` to write):

- 150 reads of leaves, then
- 50 writes: 40 replace a leaf (integer, string or boolean), 10 add a new key
  under an existing nested hash, then
- 50 reads of the attributes just written.

It then converts the object back to a hash. The result is `[values read, final
hash]`. Wrapping, the method calls and the conversion back are all inside the
timed call, so a package that wraps the whole tree eagerly and one that wraps
a level when it is first read are both counted for what they do. The 4
fixtures differ in depth (2 to 8) and width. Keys are snake_case words with an
index, so they are valid method names and clash with no method of any class.

## What counts as correct

The values read must equal the plain-object model's values, step by step (so a
write is visible to later reads), and the final hash must equal the original
with the 50 writes applied. Exact equality; there is no tolerance. Compared as
JSON: a key that is a symbol (OpenStruct, RecursiveOpenStruct) and the same key
as a string (Hashie) are the same key, and key order does not matter. Nothing
else is accepted: an adapter that does not apply the writes, or returns the
input, fails.

## What the packages do

Everything runs with default options. `Hashie::Mash` and `SnakyHash::StringKeyed`
(a Mash that also converts key names) convert the whole tree on construction and
back with `to_hash`. `RecursiveOpenStruct` wraps a level when it is read.
Ruby's `OpenStruct` is not recursive: it wraps only the top level, so the
adapter wraps each nested hash in its own `OpenStruct` and converts back with
`to_h`, level by level (the documented way to nest, as `JSON.parse(...,
object_class: OpenStruct)` does). Nothing is cached between calls.

Left out: `github.com/stretchr/objx` (Go) reads and writes by path string
(`m.Get("a.b")`), not by attribute or method; it is a different interface.
Python's `SimpleNamespace` and JavaScript proxies are not in the brief's
comparison, which is Ruby-only.
