# Serialize records

One operation serializes 50 record objects to JSON text with a serializer
(presenter, entity or builder) that the adapter declares once, at load, outside
the timed call. A record has twelve fields; the serializer selects ten
(`id`, `name`, `email`, `active`, `role`, `score`, `visits`, `joined`, `bio`
and the nested list `orders`) and leaves out the private `password_hash` and
`internal_note`. Each order is nested and serialized with three fields (`sku`,
`qty`, `price`); its `cost` is private. Orders per record: 0 to 4. The 6
fixtures differ in their values (strings with quotes, backslashes, line
breaks, non-ASCII text and emoji, empty strings, floats, integers, booleans).

The records are Ruby objects (a `Struct` with the fixture's fields), built once
per fixture in the untimed `prepare` step, because every library in this task
serializes objects and not parsed JSON. Building them is not part of the
measurement. The timed call hands the 50 objects to the declared serializer
and returns the JSON text the library produces.

## What counts as correct

The verifier parses the text as JSON and compares the structure with the
expected one: exactly the selected keys, the same values and types, the same
records in order, the same nested orders in order. Key order and white space
are style and are not compared. A private field, a missing nested list, a
missing or reordered record or a changed value fails.

All packages are gems, so this is a Ruby-only comparison. There is no
standard-library adapter: Ruby's `json` encodes data but has no declared
serializer facility. Raw JSON encoders are another job.

## Packages

Default options, the usage each library documents, an array of records
rendered as a top-level JSON array:

- `representable`: a `Representable::Decorator` with `Representable::JSON`,
  `property`/`collection` and a `collection_representer`; `to_json`.
- `jbuilder`: `Jbuilder.new`, `array!` with a block that sets each key and
  nested `array!`; `target!`.
- `active_model_serializers`: `ActiveModel::Serializer` classes with
  `attributes` and `has_many`; `ActiveModelSerializers::SerializableResource`
  with the default `attributes` adapter; `to_json`.
- `grape-entity`: `Grape::Entity` with `expose` and a nested entity;
  `represent(list).to_json`.

Left out: `jsonapi-renderer` renders JSON:API documents (a different output
shape, from hashes and not from objects).
