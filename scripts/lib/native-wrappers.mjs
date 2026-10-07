// What the Python and Ruby type checkers are given for an adapter: its own
// source, with the annotations a strict checker insists on. An adapter says
// nothing about its types, and results differ from task to task (a string, a
// list, a parsed document, a library's own object), so every function takes
// and returns the checker's "anything" type. What is measured is the cost of
// checking the adapter's body against the library's real types, which this
// leaves intact: calls into the library are still resolved and checked.

// def name(a, b=1, *rest, **options):  ->  def name(a: Any, b: Any = 1, ...) -> Any:
// Functions that already carry annotations are left as they are.
export function wrapPython(source) {
  const annotated = source.replace(/^([ \t]*)def[ \t]+(\w+)[ \t]*\(([^()]*)\)[ \t]*:/gm, (whole, indent, name, params) => {
    if (params.includes(':')) return whole
    const typed = params.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
      if (p === 'self' || p === 'cls' || p === '*' || p === '/') return p
      const [left, ...rest] = p.split('=')
      return `${left.trim()}: Any${rest.length ? ` = ${rest.join('=').trim()}` : ''}`
    })
    return `${indent}def ${name}(${typed.join(', ')}) -> Any:`
  })
  return `from typing import Any\n${annotated}`
}

// A sig above every method: sig { params(a: T.untyped).returns(T.untyped) }
export function wrapRuby(source) {
  const signed = source.replace(/^([ \t]*)def[ \t]+((?:self\.)?[A-Za-z_]\w*[?!=]?)(?:[ \t]*\(([^()]*)\)|[ \t]+([a-z_][^=\n]*?))?(?=[ \t]*(?:=|$|;|#))/gm, (whole, indent, name, inParens, bare) => {
    const names = (inParens ?? bare ?? '').split(',').map((p) => p.trim()).filter(Boolean).map((p) => p.replace(/^[*&]+/, '').split(/[=:]/)[0].trim())
    const sig = names.length ? `sig { params(${names.map((n) => `${n}: T.untyped`).join(', ')}).returns(T.untyped) }` : 'sig { returns(T.untyped) }'
    return `${indent}${sig}\n${whole}`
  })
  // Classes and modules need the sig helper too.
  const withSig = signed.replace(/^([ \t]*)(class|module)[ \t]+[^\n]+$/gm, (line, indent) => `${line}\n${indent}  extend T::Sig`)
  // Checked at "true", not "strict": strict also wants a declared type on
  // every constant, which an adapter has no reason to write.
  return `# typed: true\nextend T::Sig\n${withSig}`
}

// Standard-library packages a Go adapter imports, for the checker's export data.
export function goImports(source) {
  const block = /import\s*\(([^)]*)\)/.exec(source)?.[1] ?? ''
  const single = [...source.matchAll(/^import\s+(?:\w+\s+)?"([^"]+)"/gm)].map((m) => m[1])
  return [...[...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]), ...single]
}
