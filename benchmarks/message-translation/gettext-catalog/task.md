# Gettext catalog lookups

One operation is 50 lookups in a GNU gettext catalog that is already loaded.
Each lookup is a `msgid`, or a `msgid` with its plural and a count `n`, plus the
arguments for its `%s` and `%d` placeholders. The call looks the message up in
the catalog, picks the plural form for the catalog's locale, fills in the
placeholders and returns the 50 strings in order.

The catalog is a `.mo` file (base64 in the fixture, written by the scenario itself). It is loaded
once per fixture, in `prepare`, outside the timed call: parsing it, building the
library's catalog object and compiling the `Plural-Forms` rule are not measured. A
library that reads catalogs only from a folder (`fast_gettext`, `gettext`) or a zip
(`gettext-go`) is given the bytes that way in `prepare`; one with its own JSON
data (`jed`) is given a conversion of the parsed file there.

The 8 fixtures use two locales: `en` (`nplurals=2; plural=(n != 1)`) and `ru`
(`nplurals=3` with the usual rule for 1, 21, 31 / 2-4, 22-24 / the rest), each
with 96 messages of four shapes: one `%s`; `%s` and `%d`; a plural with `%d`;
a plural with `%s` and `%d`. Counts include 0, 1, 2, 5, 11, 12, 21, 22, 101, 111
and 1001. The names include non-ASCII text. Every tenth lookup is a message that is
not in the catalog and has to come back as written.

## What counts as correct

Exact strings. The expected output is computed by the scenario from its own
message data, a plural-rule function for each locale and a small printf for
`%s` and `%d`, with no library involved. A list of the messages as written, or of
the right messages with the English plural rule, fails (the scenario asserts
this when it loads).

Placeholders are filled with each language's own means, after the library has
returned the format string (`gettext` and `ngettext` return it unfilled): `util.format` in JavaScript, `Jed.sprintf` for `jed`, `%` in Python
and Ruby, `fmt.Sprintf` in Go and a short loop in Rust, which has no printf. All
messages keep their placeholders in the same order in every locale.

Left out of the fixtures, because the packages disagree and the specification
does not settle it for other locales: the form returned for an untranslated plural
message in a locale whose rule is not English's. GNU gettext uses `n == 1`; `fast_gettext`
applies the locale's rule to the English strings. Untranslated plurals appear
in the `en` fixtures only. Message contexts (`msgctxt`) and domains are not covered.

## Packages

Each package is used the way its documentation shows, with default options.

- `node-gettext`: `gettext(msgid)` and `ngettext(msgid, plural, n)`; the `.mo` is parsed by `gettext-parser`.
- `jed`: `gettext` and `ngettext`; the parsed `.mo` is converted to Jed's data.
- `babel` (PyPI): `babel.support.Translations(fp)`, `gettext` and `ngettext`.
- Python `gettext` (standard library): `GNUTranslations(fp)`, `gettext` and `ngettext`.
- `fast_gettext` (RubyGems): `_` and `n_` on a `:mo` text domain.
- `gettext` (RubyGems): `_` and `n_` after `bindtextdomain`.
- `chai2010/gettext-go`: `gettext.New` over a zip, `Gettext` and `NGettext`. It takes the
  plural rule from the catalog's `Language` header, so the catalogs have one.
- `gettext` (crate): `Catalog::gettext` and `ngettext`. Not passing: its `Plural-Forms`
  parser splits at `&&` before `?:`, so the Russian rule gives the wrong form. The variant
  `gettext-force-plural` gives the rule with `ParseOptions::force_plural`.

Not included: `@moductor/libintl` (JSR) binds the system's gettext library; `@axhxrx/internationalization`
uses TypeScript modules as catalogs; `@locale-kit/locale-kit` is a string filler with its own
catalog; `i18n` (RubyGems) and `universal-translator` (Go) work with keys and CLDR
categories, another job (a second task, `keyed-messages`). Ruby, Go and JavaScript have no
standard-library gettext.

See [shared methodology](../../README.md) for timing and reproduction.
