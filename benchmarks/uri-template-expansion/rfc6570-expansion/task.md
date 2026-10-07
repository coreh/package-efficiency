# RFC 6570 expansion

One operation takes a URI template (a string) and a set of variables, parses the
template and returns the expanded URI as a string. The template is parsed inside
the call every time: it is input data here, and nothing is kept between calls.

The 160 cases are:

- 115 expansions copied from RFC 6570 (sections 1.2 and 3.2.2 to 3.2.9), with
  the RFC's own variables: every operator (none, `+`, `#`, `.`, `/`, `;`, `?`,
  `&`), strings, lists and associative arrays, the explode modifier (`*`), the
  prefix modifier (`:n`), empty strings and undefined variables;
- 45 expansions of 8 templates of the kind found in API descriptions (a repository's issues, a
  search, map tiles, a file path), each with several variable sets that include
  spaces, reserved characters, percent signs and non-ASCII text.

A variable is a string, a list of strings or an associative array of strings.
An undefined variable is left out of the variable set.

## What counts as correct

The expected string is computed by an expander written for this task, inside
the scenario; it is itself checked against the RFC's examples each time the
scenario loads. An output must equal the expected string exactly, with one
accepted difference: RFC 6570 does not fix the order of the pairs of an
associative array, so the order written in the fixture and alphabetical order
by key (what a sorted map gives, as in Rust and Go) are both accepted.

Left out of the fixtures, because the RFC gives no example and the packages
disagree: an empty list given to a named operator (`{?list}` with `[]`: the RFC
text says it is undefined, `url-template` writes `list=`), and an empty value in
an exploded associative array under `;` (`;c` or `;c=`). Malformed templates,
and numbers or booleans as values, are not covered.

## Packages

Each package is used the way its documentation shows, with default options.
The variables are handed over in the form the package takes: a plain object in
JavaScript; in Rust the crate's own context or value type, built once per
fixture outside the timed call, which is the same footing.

- `url-template`: `parseTemplate(template).expand(vars)`
- `uri-templates`: `uriTemplates(template).fill(vars)`
- `uri-template`: `parse(template).expand(vars)`
- `@std-uritemplate/std-uritemplate`: `StdUriTemplate.expand(template, vars)`
- `uri-template-lite`: `UriTemplate.expand(template, vars)`. Not passing: it
  gets one of the RFC's examples wrong (`X{.keys*}`).
- `iri-string` (Rust): `UriTemplateStr::new(template)?.expand::<UriSpec, _>(&context)?.to_string()`
- `uritemplate-next` (Rust): `UriTemplate::new(template)`, `set` for each
  variable, `build()`. The crate stores the variables in the template, so they
  are copied in on every call. Not passing: it cuts a prefix (`{title:12}`) by
  bytes of UTF-8 where the RFC counts characters.

Not included: `@fedify/uri-template` (JSR) has only pre-release versions, which
the edition does not install. PyPI `uritemplate` and `uri-template` can be added
when PyPI packages can be adapters; the fixtures need no change.

See [shared methodology](../../README.md) for timing and reproduction.
