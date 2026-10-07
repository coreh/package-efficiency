# Command-line word splitting

One operation splits a POSIX shell command line into its argument words. An input
is `{ line }`, a string. A correct output is the list of words after quote removal
and escape processing: single quotes keep everything literally, double quotes keep
everything except `\"` and `\\`, an unquoted backslash escapes the next character,
adjacent quoted and unquoted pieces join into one word, and runs of spaces or tabs
separate words.

The 61 cases are built from known words, so the expected list is known by
construction. They mix plain words, words with spaces, quotes and backslashes,
non-ASCII text, words made of several quoted pieces, extra and leading or trailing
whitespace, and empty or blank lines. Outputs must equal the expected list exactly.

This is word splitting only. No variable, command or glob expansion happens, and
options are not parsed. Packages do not agree on those, so the inputs keep shell
metacharacters (`| & ; < > ( ) $ ` # * ? ~ !`) inside quotes, where every package
treats them as literal text, and double quotes never escape anything but `"` and `\`.
Empty quoted words and malformed (unterminated) lines are not part of the task.

`shell-quote` returns a list of strings for these inputs, which is the same shape as
the others. Packages run with their default settings as installed. Python uses
`shlex.split` and Ruby `Shellwords.split`; Node and Go ship no equivalent. Rust
adapters return the crate's `Vec<String>`; JSON for the verifier is built outside the
timed call. See [shared methodology](../../README.md).
