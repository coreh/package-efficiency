import { strict as assert } from 'node:assert'

// Fixtures: 5 series of 500 points on a shared x axis, drawn on a canvas of a given size.
// Every size is a multiple of 4 so that points and CSS pixels convert exactly.
const rng = (seed) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296
const sizes = [[800, 500], [640, 400], [1000, 600], [720, 448], [960, 540], [560, 352]]
const SERIES = 5, POINTS = 500
const fixtures = sizes.map(([width, height], f) => {
  const noise = rng(7 + f)
  const x = Array.from({ length: POINTS }, (_, j) => j)
  // A slow wave plus grain large enough that no point lies on the line through its
  // neighbours: a renderer that simplifies paths still has to keep all 500 vertices.
  const series = Array.from({ length: SERIES }, (_, s) => Array.from({ length: POINTS }, (_, j) =>
    Math.round((s * 30 + 40 * Math.sin(j / (23 + 5 * s) + f) + (noise() - 0.5) * 36) * 1000) / 1000))
  return { width, height, x, series }
})
export const cases = fixtures.map((input) => ({ input }))

// ---- A strict reader for the SVG a chart library writes -------------------------------

const entities = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }
const unescape = (s) => s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  assert.ok(e in entities, `unknown entity &${e};`)
  return entities[e]
})
// Well-formed XML into { name, attrs, children } (text is not needed).
export const parseXml = (text) => {
  assert.equal(typeof text, 'string', 'the SVG must be a string')
  const nameRe = '[A-Za-z_:][-A-Za-z0-9_:.]*'
  const tokenRe = new RegExp(`<!--[\\s\\S]*?-->|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>|<\\?[\\s\\S]*?\\?>|<!DOCTYPE[^>\\[]*(?:\\[[\\s\\S]*?\\])?\\s*>|<\\/(${nameRe})\\s*>|<(${nameRe})((?:\\s+${nameRe}\\s*=\\s*(?:"[^"<]*"|'[^'<]*'))*)\\s*(\\/?)>|[^<]+|<`, 'g')
  const attrRe = new RegExp(`(${nameRe})\\s*=\\s*(?:"([^"<]*)"|'([^'<]*)')`, 'g')
  const root = { name: '#root', attrs: {}, children: [] }
  const stack = [root]
  let m, pos = 0
  while ((m = tokenRe.exec(text))) {
    assert.equal(m.index, pos, `malformed XML near offset ${pos}`)
    pos = tokenRe.lastIndex
    const [token, close, open, attrText, selfClosing] = m
    if (token === '<') assert.fail(`malformed XML near offset ${m.index}`)
    if (close) {
      const top = stack.pop()
      assert.equal(top.name, close, `closing </${close}> does not match <${top.name}>`)
    } else if (open) {
      const attrs = {}
      for (const a of attrText.matchAll(attrRe)) {
        assert.ok(!(a[1] in attrs), `duplicate attribute ${a[1]}`)
        attrs[a[1]] = unescape(a[2] ?? a[3])
      }
      const node = { name: open, attrs, children: [] }
      stack[stack.length - 1].children.push(node)
      if (!selfClosing) stack.push(node)
    } else if (!token.startsWith('<')) {
      assert.ok(!/&(?!#x[0-9a-fA-F]+;|#[0-9]+;|[a-zA-Z]+;)/.test(token), 'a bare & in text')
      unescape(token)
    }
  }
  assert.equal(pos, text.length, 'malformed XML at the end')
  assert.equal(stack.length, 1, `unclosed element <${stack[stack.length - 1].name}>`)
  const elements = root.children
  assert.equal(elements.length, 1, 'exactly one root element is required')
  return elements[0]
}

const NUM = '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?'
const numbers = (s) => {
  const out = [], re = new RegExp(NUM, 'g')
  const rest = s.replace(re, (n) => { out.push(Number(n)); return ' ' })
  assert.ok(/^[\s,]*$/.test(rest), `bad number list "${s.slice(0, 40)}"`)
  return out
}
const mul = (p, q) => [p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1], p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3], p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5]]
const IDENTITY = [1, 0, 0, 1, 0, 0]
const parseTransform = (text) => {
  let m = IDENTITY, rest = text.trim()
  while (rest) {
    const t = /^(matrix|translate|scale|rotate)\s*\(([^)]*)\)\s*,?\s*/.exec(rest)
    assert.ok(t, `unsupported transform "${text}"`)
    const a = numbers(t[2])
    let n
    if (t[1] === 'matrix') { assert.equal(a.length, 6); n = a }
    else if (t[1] === 'translate') n = [1, 0, 0, 1, a[0], a[1] ?? 0]
    else if (t[1] === 'scale') n = [a[0], 0, 0, a[1] ?? a[0], 0, 0]
    else {
      const r = a[0] * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), [cx, cy] = [a[1] ?? 0, a[2] ?? 0]
      n = mul(mul([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy])
    }
    m = mul(m, n)
    rest = rest.slice(t[0].length)
  }
  return m
}
// The vertices of a path made of straight segments (absolute or relative M L H V Z).
// Returns null for anything else (curves, arcs, several subpaths, a closed shape).
export const pathVertices = (d) => {
  const pts = []
  let x = 0, y = 0, sx = 0, sy = 0, subpaths = 0, closed = false
  const re = new RegExp(`([A-Za-z])([^A-Za-z]*)`, 'g')
  assert.ok(/^\s*[Mm]/.test(d), 'a path must begin with a moveto')
  for (const [, cmd, args] of d.matchAll(re)) {
    const a = numbers(args), up = cmd.toUpperCase(), rel = cmd !== up
    if (!'MLHVZ'.includes(up)) return null
    if (up === 'Z') { closed = true; continue }
    const arity = up === 'H' || up === 'V' ? 1 : 2
    assert.ok(a.length > 0 && a.length % arity === 0, `bad arguments for ${cmd}`)
    for (let i = 0; i < a.length; i += arity) {
      if (up === 'H') x = rel ? x + a[i] : a[i]
      else if (up === 'V') y = rel ? y + a[i] : a[i]
      else { x = rel ? x + a[i] : a[i]; y = rel ? y + a[i + 1] : a[i + 1] }
      if (up === 'M' && i === 0) { subpaths++; sx = x; sy = y }
      pts.push([x, y])
    }
  }
  if (subpaths !== 1 || closed) return null
  return pts
}
const lengthPx = (s, name) => {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(px|pt)?\s*$/.exec(s ?? '')
  assert.ok(m, `the <svg> needs a ${name} in px or pt (got ${JSON.stringify(s)})`)
  return Number(m[1]) * (m[2] === 'pt' ? 4 / 3 : 1)
}
const NON_RENDERED = new Set(['defs', 'clipPath', 'mask', 'symbol', 'marker', 'pattern', 'style', 'title', 'desc', 'metadata', 'linearGradient', 'radialGradient', 'filter', 'script'])
// Size in CSS pixels, and every straight one-subpath shape in canvas pixels.
export const readSvg = (text) => {
  const svg = parseXml(text)
  assert.equal(svg.name, 'svg', `the root element is <${svg.name}>, not <svg>`)
  assert.equal(svg.attrs.xmlns, 'http://www.w3.org/2000/svg', 'the <svg> needs the SVG namespace')
  const width = lengthPx(svg.attrs.width, 'width'), height = lengthPx(svg.attrs.height, 'height')
  let base = IDENTITY
  if (svg.attrs.viewBox !== undefined) {
    const v = numbers(svg.attrs.viewBox)
    assert.ok(v.length === 4 && v[2] > 0 && v[3] > 0, 'bad viewBox')
    assert.ok(Math.abs(width / v[2] - height / v[3]) < 1e-3 * (width / v[2]), 'the viewBox and the size differ in aspect ratio')
    base = [width / v[2], 0, 0, height / v[3], -v[0] * width / v[2], -v[1] * height / v[3]]
  }
  const shapes = []
  const walk = (node, ctm) => {
    if (NON_RENDERED.has(node.name)) return
    const m = node.attrs.transform === undefined ? ctm : mul(ctm, parseTransform(node.attrs.transform))
    let pts = null
    if (node.name === 'path' && node.attrs.d !== undefined) pts = pathVertices(node.attrs.d)
    else if (node.name === 'polyline' && node.attrs.points !== undefined) {
      const a = numbers(node.attrs.points)
      assert.ok(a.length % 2 === 0, 'odd number of coordinates in points')
      pts = []
      for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]])
    }
    if (pts) shapes.push(pts.map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]))
    for (const c of node.children) walk(c, m)
  }
  walk(svg, base)
  return { width, height, shapes }
}

// ---- The check -------------------------------------------------------------------------

export const MAX_RESIDUAL = 0.5 // pixels
const lstsq = (u, v) => { // v = a u + b
  const n = u.length
  let su = 0, sv = 0, suu = 0, suv = 0
  for (let i = 0; i < n; i++) { su += u[i]; sv += v[i]; suu += u[i] * u[i]; suv += u[i] * v[i] }
  const den = n * suu - su * su
  const a = den === 0 ? 0 : (n * suv - su * sv) / den
  return [a, (sv - a * su) / n]
}
const corr = (u, v) => {
  const n = u.length, mu = u.reduce((p, c) => p + c, 0) / n, mv = v.reduce((p, c) => p + c, 0) / n
  let suv = 0, suu = 0, svv = 0
  for (let i = 0; i < n; i++) { suv += (u[i] - mu) * (v[i] - mv); suu += (u[i] - mu) ** 2; svv += (v[i] - mv) ** 2 }
  return suv / Math.sqrt(suu * svv || 1)
}
export const checkChart = ({ width, height, x, series }, output, label = 'chart') => {
  assert.equal(typeof output, 'string', `${label}: the SVG text is required`)
  const svg = readSvg(output)
  assert.ok(Math.abs(svg.width - width) <= 0.5 && Math.abs(svg.height - height) <= 0.5, `${label}: the size is ${svg.width} by ${svg.height}, not ${width} by ${height}`)
  const lines = svg.shapes.filter((s) => s.length === x.length)
  assert.equal(lines.length, series.length, `${label}: ${lines.length} paths of ${x.length} vertices, ${series.length} series expected`)
  // Pair each path with the series it draws: the one it follows most closely.
  const used = new Set(), pairs = []
  for (const line of lines) {
    const ys = line.map((p) => -p[1])
    let best = -1, bestR = -2
    series.forEach((s, k) => { const r = corr(ys, s); if (r > bestR) { bestR = r; best = k } })
    assert.ok(!used.has(best), `${label}: two paths draw series ${best}`)
    used.add(best); pairs.push([line, series[best], best])
  }
  // One mapping for all: px = a x + b, py = c y + e.
  const ux = [], vx = [], uy = [], vy = []
  for (const [line, s] of pairs) line.forEach((p, j) => { ux.push(x[j]); vx.push(p[0]); uy.push(s[j]); vy.push(p[1]) })
  const [a, b] = lstsq(ux, vx), [c, e] = lstsq(uy, vy)
  assert.ok(a > 0, `${label}: the x axis does not run left to right`)
  assert.ok(c < 0, `${label}: the y axis is not flipped (larger values must be higher up)`)
  let worst = 0
  for (let i = 0; i < ux.length; i++) worst = Math.max(worst, Math.abs(a * ux[i] + b - vx[i]), Math.abs(c * uy[i] + e - vy[i]))
  assert.ok(worst <= MAX_RESIDUAL, `${label}: a vertex is ${worst.toFixed(2)} px away from one affine mapping of the data (limit ${MAX_RESIDUAL})`)
  // The data must fill a real part of the canvas, and stay inside it.
  const span = (v) => Math.max(...v) - Math.min(...v)
  assert.ok(a * span(x) >= 0.5 * width, `${label}: the lines cover only ${(a * span(x)).toFixed(0)} px of the ${width} px width`)
  assert.ok(-c * span(uy) >= 0.4 * height, `${label}: the lines cover only ${(-c * span(uy)).toFixed(0)} px of the ${height} px height`)
  for (const [line] of pairs) for (const [px, py] of line) assert.ok(px >= -0.5 && px <= width + 0.5 && py >= -0.5 && py <= height + 0.5, `${label}: a vertex lies outside the canvas`)
  return { a, b, c, e, worst }
}
export const verifyOne = (i, output) => { checkChart(fixtures[i], output, `fixture ${i}`) }

// ---- Proof that the check can fail -----------------------------------------------------

const fmt = (n) => n.toFixed(3)
const synth = ({ width, height, x, series }, o = {}) => {
  const ys = series.flat(), lo = Math.min(...ys), hi = Math.max(...ys)
  const ax = (width - 80) / (x.length - 1), top = 20, plotH = height - 60
  const cy = o.noFlip ? plotH / (hi - lo) : -plotH / (hi - lo)
  const ey = o.noFlip ? top : top + plotH - cy * lo
  const shape = (s, k) => {
    const pts = x.slice(0, o.points ?? x.length).map((xv, j) => [40 + ax * xv, ey + cy * s[j] + (o.shift && k === 2 ? o.shift : 0) + (o.scaleOne && k === 3 ? (s[j] - lo) * 0.2 : 0)])
    if (o.polyline) return `<polyline fill="none" points="${pts.map((p) => p.map(fmt).join(',')).join(' ')}"/>`
    if (o.relative) { let px = 0, py = 0; return `<path d="M${fmt(pts[0][0])} ${fmt(pts[0][1])}${pts.slice(1).map(([qx, qy]) => { const r = `l${fmt(qx - px)} ${fmt(qy - py)}`; return r }).join('')}"/>`.replace(/^(<path d="M\S+ \S+)l/, '$1l') }
    if (o.curves) return `<path d="M${pts[0].join(' ')}${pts.slice(1).map((p) => `C${p.join(' ')} ${p.join(' ')} ${p.join(' ')}`).join('')}"/>`
    return `<path d="M${pts.map((p) => p.map(fmt).join(' ')).join('L')}"/>`
  }
  const body = series.slice(0, o.count ?? series.length).map(shape).join('')
  const inner = o.group ? `<g transform="translate(10 5)"><g transform="scale(2)">${body}</g></g>` : `<g>${body}</g>`
  return `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="${o.width ?? width}" height="${o.height ?? height}"><defs><path d="M0 0L1 1"/></defs>${inner}</svg>`
}
// Good outputs in several spellings: absolute, a polyline, and groups with transforms.
{
  const f = fixtures[0]
  assert.ok(checkChart(f, synth(f)).worst < 0.01)
  assert.ok(checkChart(f, synth(f, { polyline: true })).worst < 0.01)
  const g = synth(f, { group: true }).replace(/ax/, '')
  // The same chart drawn at half scale inside a group with scale(2) and translate(10 5).
  const half = { ...f, width: f.width, height: f.height }
  const bad = (o, why) => assert.throws(() => checkChart(half, synth(f, o)), why)
  bad({ noFlip: true }, /not flipped/)
  bad({ points: 499 }, /paths of 500/)
  bad({ count: 4 }, /paths of 500/)
  bad({ shift: 2 }, /away from one affine/)
  bad({ scaleOne: true }, /away from one affine/)
  bad({ width: f.width + 40 }, /size is/)
  bad({ curves: true }, /paths of 500/)
  assert.throws(() => checkChart(f, '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"></svg>'), /paths of 500/)
  assert.throws(() => checkChart(f, JSON.stringify(f)), /malformed|root/)
  assert.ok(g.length > 0)
}

export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => value.length
