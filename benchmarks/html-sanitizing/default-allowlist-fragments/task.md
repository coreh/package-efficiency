# Sanitize untrusted HTML fragments

One operation takes one untrusted HTML fragment (a string of 0.4 to 4 kB) and
returns the sanitized HTML string the library returns, with the library's
default options and allow-list.

The 40 fragments are generated deterministically. Each is a mix of harmless
content (paragraphs with bold and italic text, links, lists, block quotes, code,
non-ASCII text and entities, and allowed elements that carry an event handler
the sanitizer must take off) and hostile content: `script` in several
spellings, `img` with `onerror`, `javascript:` links spelled in upper case, with
a leading space, with a tab inside, with character references and as
`vbscript:` and `data:text/html`, `on*` handlers on many elements, `svg` with
`onload`, `iframe`, `object`, `embed`, `style`, `form` with an `action`, unknown
elements (`blink`, `x-widget`), broken nesting (`<scr<script>ipt>`), a comment
holding a script, and unclosed tags.

## What counts as correct

Sanitizers legitimately differ in what they keep and how they write it: bleach
and xss escape an element that is not allowed instead of removing it, the
others remove it and keep its text, some write `rel` attributes on links, and
the allow-lists are not the same. None of that is compared. The verifier
parses the output with a strict HTML tokenizer (the way a browser would:
attribute quoting and spacing, character references, comments, raw text
elements) and checks:

1. **Nothing dangerous is left.** No `script`, `iframe`, `object`, `embed`,
   `applet`, `frame`, `frameset` or `base` element; no attribute whose name
   starts with `on`; no `javascript:`, `vbscript:`, `livescript:` or `mocha:`
   address, and no `data:` address (except on `img`, `source`, `video`,
   `audio` and `track` `src`), in any attribute that holds an address
   (`href`, `src`, `action`, `formaction`, `xlink:href`, `srcset`, `data`, ...).
   The address is read after decoding character references and with control
   characters and spaces removed, as a browser does.
2. **The allowed content is there.** The generator records the pieces that
   every default allow-list keeps: the elements `a`, `b`, `i`, `em`, `strong`,
   `ul`, `li`, `code` and `blockquote` must appear exactly as often as in the
   input's harmless parts, and every `a` that has an address must be one of the
   safe `https` links, in order, with its address unchanged. Text of harmless
   parts, and text inside elements that are unwrapped or escaped (`div`,
   `span`, `blink`, `x-widget`, a link whose `href` was removed), must appear in
   the output, in order, once white space is collapsed.

Not compared: whether `p`, `div`, `img` and the like are kept (the small
allow-lists of bleach and xss do not have them), the text of `script`,
`style` and `form` elements, `rel` and `title` attributes, comments, and
`style` attributes (DOMPurify and sanitize-html keep some, and CSS
expressions do not run in current browsers). A link whose address was removed
may be left as `<a>` or `<a href>`. Protocol-relative links, and a tag left
open at the end of the input, are not in the fixtures, because the packages
differ on them.

The check was tried on the input unchanged, on the input with all tags cut
out, and on the input with only `script` removed; all three fail, and the
scenario asserts it when it loads. An HTML escaper fails too (no elements are
left), as does a regular expression that removes `script` and `on*`
attributes (the `javascript:` links remain).

## Packages

Each runs the way its documentation shows, with default options. Anything set
up once in a program (a policy, a sanitizer object, a DOM window) is set up
once, outside the timed call.

- npm `dompurify`: `DOMPurify.sanitize(html)`. It needs a DOM, so it is given a
  `jsdom` window, created once; `jsdom` is installed beside it.
- npm `sanitize-html`: `sanitizeHtml(html)`.
- npm `xss`: `xss(html)`. Disallowed tags are escaped.
- Rust `ammonia`: `ammonia::clean(html)`.
- PyPI `bleach`: `bleach.clean(html)`. Disallowed tags are escaped.
- PyPI `nh3`: `nh3.clean(html)`, a binding of ammonia.
- PyPI `lxml-html-clean`: `clean_html(html)`, which wraps a fragment in a
  `div`.
- RubyGems `loofah`: `Loofah.scrub_fragment(html, :strip).to_s`.
- RubyGems `rails-html-sanitizer`: `Rails::HTML5::SafeListSanitizer#sanitize`.
- RubyGems `sanitize`: `Sanitize.fragment(html)`. Its default config removes
  every element, so the allowed elements are missing and it is recorded as not
  passing. The `sanitize-basic` variant passes `Sanitize::Config::BASIC`.
- Go `bluemonday`: `UGCPolicy().Sanitize(html)`. The library has no default
  policy; `UGCPolicy` is the one its documentation gives for user-generated
  content (`StrictPolicy` removes every element).

The libraries do different amounts of work: DOMPurify, loofah, rails-html-sanitizer,
sanitize and lxml build a DOM tree, ammonia/nh3 build one with html5ever,
bluemonday and sanitize-html tokenize, and xss scans with its own parser. That
is what is compared.

No standard library has an HTML sanitizer, so there are no built-in entries.
No JSR package does this job. Left out: `isomorphic-dompurify` (DOMPurify with
jsdom bundled, the same work), `rails-deprecated_sanitizer` (deprecated).
Not included: `html-sanitizer` and `sanitize-html-rs` style crates (not widely
used, not checked).

See [shared methodology](../../README.md) for timing and reproduction.
