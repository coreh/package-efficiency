# Template rendering: loop, conditional, escaped values

One operation compiles a template and renders it to a string from one data
object. The template is a small HTML page: a title in a heading and in a quoted
attribute, an author line, a list with one `<li>` per record (a loop), a
conditional CSS class and a conditional note per record, a nested loop over each
record's tags, and a count. All interpolated text values are HTML-escaped.

An input is a JSON object `{ title, author, count, items }`. Each item has an
integer `id`, a string `name`, an integer `price`, a boolean `featured`, a
string `note` (empty means "no note") and an array of string `tags`. Text mixes
plain ASCII, markup characters, quotes, existing entities and Unicode. The 40
cases hold between 3 and 62 items.

Every adapter holds the same template written in its engine's syntax and, in
every call, compiles it from its source text and renders it. Neither the task
nor any library keeps a compiled template or an output between calls. A
runtime's own code cache may still apply: Eta compiles by passing generated
source to `new Function`, the source is identical in every call, and a
JavaScript engine may reuse its compilation of identical dynamic code. Where a
library has an engine or registry object that is separate from the template
(Handlebars, TinyTemplate, Eta), that object is built once before the run; Go's
`html/template` and Ruby's `ERB` have none, so the whole object is built in the
call. Engines run with their default settings as installed, with the default
escaping on.

`@bgub/eta` (4.6.0) and `@eta-dev/eta` (3.5.0) are the same library, Eta, at two
versions published under two JSR scopes.

A correct output is the same HTML as an independent reference, after these
normalizations (applied to both sides, in verification only): runs of
whitespace collapse to one space and whitespace between tags is dropped, since
engines differ in how they treat newlines around tags; and entities are
canonicalized. Libraries spell the escapes of `&`, `<`, `>`, `"` and `'` as
named, decimal or hex entities; all spellings are accepted. Some engines also
escape `=`, `` ` ``, `+` or `/`; escaping those is optional and accepted. An
output that leaves any of the five characters unescaped fails.

Standard-library entries: Go `html/template` (contextual escaping) and Ruby
`ERB` with `ERB::Util.html_escape`. JavaScript and Python have no standard
template engine with loops, so they have no entry.
