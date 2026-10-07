# Stripping ANSI escape codes

One operation takes a line of terminal text and returns it with every ANSI escape
sequence removed, leaving only the visible text. The 48 cases are lines of about 20 to
200 visible columns of words (ASCII, accented letters, CJK, emoji), styled with
escape codes every few words: basic and bright SGR colors, bold/underline/reset,
256-color and truecolor (`38;5;n`, `38;2;r;g;b`), erase-line and cursor-movement
CSI sequences, and OSC 8 hyperlinks terminated by BEL or by ST (`ESC \`). One
line has no escape codes and one is empty.

A correct output is exactly the visible text, which each fixture carries as its
expected value. A package that leaves any part of a sequence behind, or removes
visible text, fails. Inputs are preconstructed strings; wrapping, slicing and
width measurement are outside this task, since the packages do not share them.

All packages run with default settings as installed. Rust crates return an owned
`String`, as their APIs do; `console` returns a `Cow` that is borrowed when there
is nothing to strip, like the JavaScript functions that return their input. The
standard-library adapters (Python, Ruby and Go) use one regular expression for
CSI and OSC sequences, since those languages have no built-in function for this.
See [shared methodology](../../README.md) for timing and reproduction.
