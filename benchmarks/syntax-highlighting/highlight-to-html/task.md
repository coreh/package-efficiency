# Source to highlighted HTML

One operation takes one source file (a string) and the name of its language,
`javascript` or `python`, and returns the file as highlighted HTML, the way the
library returns it. The language is given; nothing is detected.

The 24 files (12 JavaScript, 12 Python, 0.8 to 14 kB) are generated
deterministically: functions with loops, conditions, numbers, line and block
comments, double- and single-quoted strings, an import and a class. They
contain the things a careless tokenizer gets wrong: comments with quotes,
apostrophes, keywords and numbers in them; strings that contain `//`, `/*`, `#`
and escaped quotes; a comment after code on the same line; non-ASCII text.

## What counts as correct

Highlighters legitimately differ in their markup: class names (`hljs-keyword`,
`token keyword`), inline colours from a theme, nested or flat elements, wrapper
elements, entity spellings. None of that is compared. The verifier reads the
markup the way a browser would and checks two things.

1. **The text is the source.** With tags removed and entities decoded, the
   output is exactly the input. A newline right after `<pre>` is dropped, as
   HTML does, and newlines at the very end are not compared.
2. **The kinds of token are told apart.** While it writes each file, the
   generator records where the comments, strings, keywords, numbers and plain
   identifiers are. Every character has a styling: the `class` and `style` of
   the innermost element around it that has either (wrapper elements such as
   `pre` and `code` do not count). No styling may be shared by two of comment,
   string, keyword and number; a plain identifier may not be styled like a
   comment or a string; and no comment, string, keyword or number may be left
   unstyled.

So a library is free to call a comment whatever it likes and colour it as it
likes, but a quote inside a comment that starts a "string", or a `//` inside a
string that starts a "comment", fails, because then two kinds share a styling.
Output that only escapes the text, and a regular-expression highlighter that
does not track strings and comments together, were both tried and fail.

Not compared, because highlighters differ in ways that are a matter of style:
quotes and comment markers (some style them as punctuation; a probe covers the
body of the token), whitespace, escape sequences inside strings, operators,
punctuation, and whether a plain identifier looks like a keyword or a number
(themes often give constants the colour of numbers). Only keywords every
grammar agrees on are probed (`const`, `let`, `function`, `return`, `if`,
`else`, `for`, `while`, `import`, `export`, `class`, `def`).

## Packages

Each runs the way its documentation shows, with default options. Anything that
is set up once in a program (a highlighter object, the loaded grammars and
theme) is set up once, outside the timed call; every call highlights a whole
file from scratch.

- `highlight.js`: `hljs.highlight(code, { language }).value`, from the default
  import, which registers all bundled languages. Class-based markup.
- `prismjs`: `Prism.highlight(code, Prism.languages[language], language)`;
  Python is loaded with the package's `loadLanguages`. Class-based markup.
- `shiki`: `createHighlighter({ themes, langs })` once (the default Oniguruma
  engine, compiled to WebAssembly), then `highlighter.codeToHtml(code, { lang,
  theme })`, which is synchronous. Inline styles from the `github-dark` theme.
- `syntect` (Rust): `highlighted_html_for_string` with the bundled syntaxes and
  the `base16-ocean.dark` theme, default features (Oniguruma). Inline styles.

The libraries do different amounts of work for the same file, and that is what
is compared: `shiki` and `syntect` run TextMate and Sublime grammars and resolve
a theme to colours; `highlight.js` and `prismjs` run their own smaller grammars
and write class names.

Not included yet: PyPI `pygments`, RubyGems `rouge` and `coderay`, and the Go
modules in the brief, which can be added when those registries can supply
adapters; the check needs no change for them (class-based or inline-styled
output are both read). `lowlight`, `refractor` and `@wooorm/starry-night`
return a syntax tree, not HTML. `@speed-highlight/core` is asynchronous.

See [shared methodology](../../README.md) for timing and reproduction.
