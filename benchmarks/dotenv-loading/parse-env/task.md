# Parse .env text into a map

One operation parses the text of a .env file into a key-value map of strings.
The 40 inputs are built deterministically: from 4 up to 160 assignments each,
with a leading comment, blank lines, comment lines, bare values, empty values,
double-quoted and single-quoted values (containing spaces, `#`, `=`, tabs, URLs
and non-ASCII text) and unquoted values followed by a trailing `# comment`.
A correct output has exactly the expected keys and string values.

Variable references (`${NAME}`), backslash escapes and multi-line values are not
used: libraries disagree there, and some only expand through a separate package.
Loading into the process environment is not part of the task; each adapter calls
the library's parse function on the in-memory text and returns its map. Maps are
compared by entries, so a null-prototype object and a plain object are
equivalent. Packages run with default settings as installed.
See [shared methodology](../../README.md) for timing and reproduction.
