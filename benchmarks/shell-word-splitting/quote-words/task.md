# Quoting words into a command line

One operation turns a list of argument words into a single command-line string that
a POSIX shell would split back into exactly those words. An input is `{ words }`, a
list of strings. The output is a string.

Packages choose different quoting styles (backslashes, single quotes, double quotes),
so the output is not compared to a fixed string. The verifier splits each output with
its own small POSIX splitter and requires the words to come back identical, in order.
It also requires that a word with a space, quote, backslash or shell metacharacter is
not left bare (a plain join fails). Empty words must survive the round trip.

The 60 cases are built from lists of 1 to 10 words: plain options and paths,
words with spaces or tabs, quotes, backslashes, non-ASCII text, shell metacharacters
(`| & ; < > ( ) $ ` # * ? ~ { }`), and empty words. Words with `!` or newlines are left
out because packages differ in how they quote history expansion and line breaks.

Packages run with their default settings as installed. Python uses `shlex.join` and
Ruby `Shellwords.join`; Node and Go ship no equivalent. Rust adapters pass the words
as `&str` taken from the input and return a `String`. See
[shared methodology](../../README.md).
