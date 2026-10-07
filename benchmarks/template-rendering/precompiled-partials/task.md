# Template rendering: precompiled template with a partial

One operation renders an already compiled template to a string from one data
object. Unlike `loop-escaped`, which compiles the template in every call, this
task measures only rendering: real applications compile their templates once at
start-up. In every adapter the page template and the row template are compiled
or registered once before the run, with the engine's default settings, and each
call only renders the page by name (or executes the parsed template).

The page is an invoice: a heading, a customer line with nested lookups
(`customer.name`, `customer.email`, `customer.address.city`), a table with one
row per record, and a footer with a precomputed total. Each row is produced by a
partial (Handlebars partial, Eta `include`, TinyTemplate `call ... with`, Go
`{{template}}`, a method for Ruby ERB, which has no partials). A row has an
`if / else` on a boolean `rush`: "Rush: reason" or "Standard". All text values
are HTML-escaped; integers are written as they are.

An input is `{ title, customer: { name, email, address: { city } }, rows,
footer, total }`; each row has string `sku`, `name`, `reason`, integers `qty`
and `price`, and boolean `rush`. Text mixes ASCII, markup characters, quotes,
existing entities and Unicode. The 40 cases hold between 5 and 83 rows.

A correct output is the same HTML as an independent reference, after the same
normalizations as `loop-escaped` (applied in verification only): whitespace
runs collapse and whitespace between tags is dropped; entity spellings of the
five characters `& < > " '` are canonicalized, and optional escapes of `=`,
`` ` ``, `+` and `/` are accepted. Leaving any of the five unescaped fails, as
does skipping the loop, partial or conditionals.

Standard-library entries: Go `html/template` (contextual escaping) and Ruby
`ERB` (templates compiled into methods with `ERB#def_method`, explicit
`ERB::Util.html_escape`). Packages run with default settings as installed.
`@bgub/eta` and `@eta-dev/eta` are the same library at two versions.

Go decodes JSON numbers to `float64` and prints one of a million or more in
exponent form, so fixture quantities, prices and totals are kept below one
million (integers print in full on every engine).
