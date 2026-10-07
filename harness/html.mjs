// Comparing a page a framework rendered with the page it should have
// rendered. Frameworks wrap a page in their own markup and spell the same
// HTML in different ways, so only one element is compared (the fragment from
// `open` to `close`), and both sides are brought to one spelling first:
//   - comments are dropped (React puts <!-- --> between pieces of text), and
//     so is the empty <!> that Leptos leaves where a list or an optional
//     piece is filled in (a browser reads it as a comment too);
//   - the attribute that Dioxus puts on elements for its client code to find
//     them again (data-node-hydration) is dropped;
//   - whitespace between tags, and at the ends, is dropped;
//   - an empty attribute value is dropped (hidden="" is hidden);
//   - a self-closing slash is dropped (<br/> is <br>);
//   - the spellings of an escaped quote or apostrophe become the character;
//   - the numeric spellings of an escaped &, < or > become &amp; &lt; &gt;.
// &amp; &lt; and &gt; themselves are left alone: text that should be escaped
// must be.
export function normalizeHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!>/g, '')
    .replace(/\sdata-node-hydration="[^"]*"/g, '')
    .replace(/>\s+</g, '><')
    .replace(/=""/g, '')
    .replace(/\s*\/>/g, '>')
    .replace(/&(?:#x27|#39|apos);/gi, "'")
    .replace(/&(?:quot|#34|#x22);/gi, '"')
    .replace(/&(?:#38|#x26);/gi, '&amp;')
    .replace(/&(?:#60|#x3c);/gi, '&lt;')
    .replace(/&(?:#62|#x3e);/gi, '&gt;')
    .trim()
}

// The fragment of `body` from the first `open` to the `close` after it, or null.
export function fragmentOf(body, open, close) {
  const start = body.indexOf(open)
  if (start === -1) return null
  const end = body.indexOf(close, start)
  return end === -1 ? null : body.slice(start, end + close.length)
}
