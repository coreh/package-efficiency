// Runtime and language marks. They are shown only to identify each runtime;
// the marks belong to their respective projects.
//   labels: full-colour marks from the Iconify "logos" set
//   page text: one-colour marks from simple-icons
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { siBun, siDeno, siNodedotjs, siRust, siJavascript, siTypescript, siPython, siPypy, siRuby, siGo, siJsr, siRubygems, siPerplexity, siDeepseek, siKimi } from 'simple-icons'

const ICONS = { javascript: siJavascript, python: siPython, node: siNodedotjs, bun: siBun, deno: siDeno, rust: siRust, typescript: siTypescript, cpython: siPython, pypy: siPypy, ruby: siRuby, 'ruby-yjit': siRuby, go: siGo }

// Package ecosystems. The built-ins have no mark of their own, so they get a
// plain drawing of a chip.
const CHIP = { path: 'M7 7h10v10H7zm2 2v6h6V9zM9 2h2v3H9zm4 0h2v3h-2zM9 19h2v3H9zm4 0h2v3h-2zM2 9h3v2H2zm0 4h3v2H2zm17-4h3v2h-3zm0 4h3v2h-3z' }
Object.assign(ICONS, { 'eco-jsr': siJsr, 'eco-rubygems': siRubygems, 'eco-gomod': siGo, 'eco-builtin': CHIP })

const logos = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@iconify-json/logos/icons.json'), 'utf8'))
const COLOR = { node: 'nodejs-icon', bun: 'bun', deno: 'deno', rust: 'rust', typescript: 'typescript-icon', cpython: 'python', pypy: 'python', ruby: 'ruby', 'ruby-yjit': 'ruby', go: 'go' }

// Official Shopify/yjit README logo: full-colour wordmark on labels,
// monochrome diamond beside page text.
const yjitImage = `data:image/png;base64,${readFileSync(new URL('./assets/yjit.png', import.meta.url)).toString('base64')}`
const yjitMark = `<image href="${yjitImage}" width="1535" height="416"/>`
let iconSequence = 0

// For labels, which are always on white: the mark in its own colours, fitted
// into a `size` square.
export function labelIcon(id, x, y, size) {
  if (id === 'ruby-yjit') return `<svg x="${x - size}" y="${y}" width="${size * 2}" height="${size}" viewBox="0 0 1535 416" aria-hidden="true">${yjitMark}</svg>`
  if (id === 'pypy') return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path fill="#${siPypy.hex}" d="${siPypy.path}"/></svg>`
  const mark = logos.icons[COLOR[id]]
  if (!mark) return ''
  const prefix = `runtime-icon-${++iconSequence}-`
  let body = mark.body
  for (const [, id] of mark.body.matchAll(/id="([^"]+)"/g)) body = body.replaceAll(id, prefix + id)
  const width = mark.width ?? logos.width
  const height = mark.height ?? logos.height
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${width} ${height}" aria-hidden="true">${body}</svg>`
}

// The marks fill their square very differently: a solid block, a wide flat
// wordmark, a thin outline. Each is drawn in the same slot and nudged in size
// so they look alike in weight; the slot itself never changes, so text beside
// them lines up.
const OPTICAL = { 'eco-pypi': 1.25, 'eco-cargo': 1.15, 'eco-npm': 1.3, 'eco-jsr': 1.3, go: 1.4, 'eco-rubygems': 0.96, javascript: 0.86, typescript: 0.86, 'eco-gomod': 1.15, bun: 1.08 }
const scaled = (id) => (OPTICAL[id] ? ` style="transform:scale(${OPTICAL[id]})"` : '')

// Some marks are shown as line drawings in the text colour, made from their
// own artwork (site/assets/marks holds the files that are not in the installed
// icon sets). The shapes are edited as vectors, so the result stays sharp at
// text size:
//   lines  keeps only the artwork's dark shapes (outline, eyes, mouth) and
//          thickens them with a stroke; the colour fills are dropped
//   faces  turns every filled shape into an outline, for artwork made of
//          separate flat faces
//   pick   outlines the shapes filled with the `outline` colours, keeps the
//          ones filled with the `solid` colours as solid shapes, drops the rest.
//          Shapes still cover the ones drawn before them, as in the artwork,
//          so the drawing is not a see-through wireframe
const markFile = (name) => {
  const source = readFileSync(new URL(`./assets/marks/${name}.svg`, import.meta.url), 'utf8')
  const [, width, height] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(source)
  return { width: Number(width), height: Number(height), body: source.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '') }
}
const LINE_ART = {
  'eco-gomod': { art: markFile('gopher'), mode: 'lines', weight: 0.03 },
  // crates.io: the crates of the Cargo logo as outlines, standing on its pallet.
  'eco-cargo': { art: markFile('cargo'), mode: 'pick', weight: 0.034, outline: ['#e5ac3d', '#e3b04e'], solid: ['#977753', '#7a552c', '#886947', '#9a7246', '#694a27', '#715a40', '#6d471e', '#7a5f41'] },
}
const isDark = (fill) => {
  if (!fill || fill === 'currentColor' || fill === 'black') return true
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(fill)?.[1]
  if (!hex) return false
  const [r, g, b] = (hex.length === 3 ? [...hex].map((c) => c + c) : hex.match(/../g)).map((c) => parseInt(c, 16))
  return 0.299 * r + 0.587 * g + 0.114 * b < 70
}
function lineArt(id) {
  const { art, mode, weight, outline = [], solid = [] } = LINE_ART[id]
  const [w, h] = [art.width ?? logos.width, art.height ?? logos.height]
  const stroke = `stroke="currentColor" stroke-width="${(w * weight).toFixed(2)}" stroke-linejoin="round" stroke-linecap="round"`
  // Shapes inside a moved group keep that group's transform.
  const flat = art.body.replace(/<g transform="([^"]*)">(.*?)<\/g>/gs, (_, transform, inner) => inner.replace(/\/>/g, ` transform="${transform}"/>`))
  const shapes = [...flat.matchAll(/<(path|circle|ellipse|rect|polygon)\b[^>]*?\/>/g)]
    .map(([tag]) => {
      const fill = /\sfill="([^"]*)"/.exec(tag)?.[1]
      if (mode === 'lines' && !isDark(fill)) return ''
      if (mode === 'pick' && !outline.includes(fill) && !solid.includes(fill)) return ''
      const bare = tag.replace(/\s(fill|stroke|stroke-width|stroke-miterlimit)="[^"]*"/g, '')
      if (mode === 'pick') return bare.replace(/\/>$/, solid.includes(fill) ? ' fill="#fff"/>' : ` fill="#000" ${stroke.replace('currentColor', '#fff')}/>`)
      return bare.replace(/\/>$/, ` fill="${mode === 'lines' ? 'currentColor' : 'none'}" ${stroke}/>`)
    })
    .join('')
  const pad = w * weight
  if (mode === 'pick') {
    const mask = `mark-${++iconSequence}`
    const box = `x="${-pad}" y="${-pad}" width="${w + 2 * pad}" height="${h + 2 * pad}"`
    return `<svg class="ico"${scaled(id)} viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" aria-hidden="true"><defs><mask id="${mask}" maskUnits="userSpaceOnUse" ${box}>${shapes}</mask></defs><rect ${box} fill="currentColor" mask="url(#${mask})"/></svg>`
  }
  return `<svg class="ico"${scaled(id)} viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" aria-hidden="true">${shapes}</svg>`
}
// PyPI: its logo is a pile of cubes, some of them coloured to form the Python
// mark. In one colour the coloured cubes are solid and the plain ones are
// outlines. The artwork lists each cube face followed by its edges.
const PYPI = { plain: ['#f7f7f4', '#efeeea', '#fff'], coloured: ['#ffd242', '#ffc91d', '#3775a9', '#2f6491'], edge: '#ccc' }
function pypiIcon() {
  const art = logos.icons.pypi
  const [w, h] = [art.width ?? logos.width, art.height ?? logos.height]
  const line = w * 0.022
  let solid = false
  const shapes = [...art.body.matchAll(/<(path|ellipse)\b[^>]*?\/>/g)]
    .map(([tag, kind]) => {
      const fill = /\sfill="([^"]*)"/.exec(tag)?.[1]
      const bare = tag.replace(/\sfill="[^"]*"/, '')
      const draw = (attrs) => bare.replace(/\/>$/, ` ${attrs}/>`)
      if (kind === 'ellipse') return draw('fill="#000"')
      if (PYPI.coloured.includes(fill)) return (solid = true), draw('fill="#fff"')
      if (PYPI.plain.includes(fill)) return (solid = false), draw('fill="#000"')
      if (fill !== PYPI.edge) return ''
      return solid ? draw(`fill="#000" stroke="#000" stroke-width="${(line * 0.25).toFixed(2)}"`) : draw(`fill="#fff" stroke="#fff" stroke-width="${line.toFixed(2)}" stroke-linejoin="round"`)
    })
    .join('')
  const mask = `mark-${++iconSequence}`
  const box = `x="${-line}" y="${-line}" width="${w + 2 * line}" height="${h + 2 * line}"`
  return `<svg class="ico"${scaled('eco-pypi')} viewBox="${-line} ${-line} ${w + 2 * line} ${h + 2 * line}" aria-hidden="true"><defs><mask id="${mask}" maskUnits="userSpaceOnUse" ${box}>${shapes}</mask></defs><rect ${box} fill="currentColor" mask="url(#${mask})"/></svg>`
}

// npm: the three letters of its wordmark, without the box around them.
const npmIcon = () => `<svg class="ico"${scaled('eco-npm')} viewBox="1 -4.5 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1 1h4v4H4V2H3v3H1zM6 1h4v4H8v1H6zM8 2v2h1V2zM11 1h6v4h-1V2h-1v3h-1V2h-1v3h-2z"/></svg>`

// The large marks are drawn from a file of their own, shared by every page,
// instead of being repeated inside each one: the page carries a small box in
// the text colour and the file cuts the mark out of it.
// The category groups: plain line drawings, simpler than the category icons
// because they sit beside titles and in the sidebar at text size.
const GROUP_ICONS = {
  web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3.500 3 3.500 15 0 18M12 3c-3.500 3-3.500 15 0 18',
  'data-formats': 'M9 4C7 4 6 5 6 7v2c0 1.500-1 3-2.500 3C5 12 6 13.500 6 15v2c0 2 1 3 3 3M15 4c2 0 3 1 3 3v2c0 1.500 1 3 2.500 3-1.500 0-2.500 1.500-2.500 3v2c0 2-1 3-3 3',
  'markup-and-code': 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  text: 'M5 7V4h14v3M12 4v16M9 20h6',
  'data-structures': 'M9 3h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 8v4M6 16v-4h12v4',
  'security-and-compression': 'M5.500 11h13v9.500h-13zM8.500 11V8a3.500 3.500 0 0 1 7 0v3M12 14.500v2.500',
  'numbers-and-time': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.500 2',
  concurrency: 'M3 7h17M16.500 3.500L20 7l-3.500 3.500M21 17H4M7.500 13.500L4 17l3.500 3.500',
  system: 'M3 5h18v14H3zM7 10l3 2.500L7 15M12.500 15H17',
  storage: 'M5 6c0-1.700 3.100-3 7-3s7 1.300 7 3-3.100 3-7 3-7-1.300-7-3zM5 6v12c0 1.700 3.100 3 7 3s7-1.300 7-3V6M5 12c0 1.700 3.100 3 7 3s7-1.300 7-3',
  observability: 'M2.500 12H7l2.500-6.500 4 13L16 12h5.500',
  media: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 5M15.500 9.500h.010',
  // One of a kind: a snowflake.
  'not-comparable': 'M12 2.5L12 21.5M20.23 7.25L3.77 16.75M20.23 16.75L3.77 7.25M9.5 4.5L12 7L14.5 4.5M17.25 6.08L16.33 9.5L19.75 10.42M19.75 13.58L16.33 14.5L17.25 17.92M14.5 19.5L12 17L9.5 19.5M6.75 17.92L7.67 14.5L4.25 13.58M4.25 10.42L7.67 9.5L6.75 6.08',
}
export const groupIcon = (id) => (GROUP_ICONS[id] ? inlineIcon(`group-${id}`) : '')
// Drawn by scripts/trace-registry-icons.py; see there for how.
const BOX_ICONS = {
  "eco-pypi": {
    "body": "<mask id=\"pypi-snake\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"24\" height=\"24\"><path d=\"M4.28 9.78L7.35 10.9L10.47 9.77L7.4 8.65z\" fill=\"#000\"/><path d=\"M4.28 9.78L7.35 10.9L7.35 14.51L4.28 13.39z\" fill=\"#000\"/><path d=\"M7.37 7.26L10.44 8.38L13.55 7.24L10.48 6.13z\" fill=\"#000\"/><path d=\"M7.37 7.26L10.44 8.38L10.44 11.99L7.37 10.87z\" fill=\"#000\"/><path d=\"M1.2 14.55L4.27 15.67L7.38 14.53L4.32 13.41z\" fill=\"#000\"/><path d=\"M1.2 14.55L4.27 15.67L4.27 19.27L1.2 18.16z\" fill=\"#000\"/><path d=\"M4.28 15.67L7.35 16.79L7.35 20.39L4.28 19.28z\" fill=\"#000\"/><path d=\"M4.28 12.03L7.35 13.14L10.47 12.01L7.4 10.89z\" fill=\"#000\"/><path d=\"M4.28 12.03L7.35 13.14L7.35 16.75L4.28 15.63z\" fill=\"#000\"/><path d=\"M19.68 14.54L19.68 18.15L22.8 17.02L22.8 13.41z\" fill=\"#000\"/><path d=\"M16.6 15.67L16.6 19.27L19.72 18.14L19.72 14.53z\" fill=\"#000\"/><path d=\"M13.52 16.79L13.52 20.39L16.63 19.26L16.63 15.65z\" fill=\"#000\"/><path d=\"M10.44 17.91L10.44 21.52L13.55 20.38L13.55 16.77z\" fill=\"#000\"/><path d=\"M7.37 16.79L10.44 17.91L10.44 21.52L7.37 20.4z\" fill=\"#000\"/><path d=\"M19.68 10.9L19.68 14.51L22.8 13.38L22.8 9.77z\" fill=\"#000\"/><path d=\"M16.62 6.14L16.62 9.75L19.73 8.61L19.73 5.01z\" fill=\"#fff\"/><path d=\"M16.62 6.14L19.68 7.26L22.8 6.12L19.73 5.01z\" fill=\"#000\"/><path d=\"M19.68 7.26L19.68 10.87L22.8 9.73L22.8 6.12z\" fill=\"#000\"/><path d=\"M16.6 12.02L16.6 15.63L19.72 14.5L19.72 10.89z\" fill=\"#000\"/><path d=\"M16.6 8.38L16.6 11.99L19.72 10.85L19.72 7.24z\" fill=\"#fff\"/><path d=\"M13.53 3.62L16.6 4.74L19.72 3.6L16.65 2.48z\" fill=\"#fff\"/><path d=\"M16.6 4.74L16.6 8.34L19.72 7.21L19.72 3.6z\" fill=\"#fff\"/><path d=\"M10.45 15.63L13.52 16.75L16.63 15.62L13.56 14.5z\" fill=\"#fff\"/><path d=\"M13.52 13.14L13.52 16.75L16.63 15.62L16.63 12.01z\" fill=\"#000\"/><path d=\"M13.52 9.5L13.52 13.11L16.63 11.97L16.63 8.37z\" fill=\"#fff\"/><path d=\"M10.48 12.01L13.55 13.13L13.55 16.74L10.48 15.62z\" fill=\"#fff\"/><path d=\"M10.44 14.26L10.44 17.87L13.55 16.74L13.55 13.13z\" fill=\"#fff\"/><path d=\"M7.37 13.15L10.44 14.26L10.44 17.87L7.37 16.76z\" fill=\"#fff\"/><path d=\"M7.37 9.5L10.44 10.62L13.55 9.49L10.48 8.37z\" fill=\"#fff\"/><path d=\"M10.44 10.62L10.44 14.23L13.55 13.09L13.55 9.49z\" fill=\"#fff\"/><path d=\"M7.37 9.5L10.44 10.62L10.44 14.23L7.37 13.11z\" fill=\"#fff\"/><path d=\"M10.45 4.74L10.45 8.35L13.56 7.21L13.56 3.61z\" fill=\"#fff\"/><path d=\"M10.45 4.74L13.52 5.86L16.63 4.72L13.56 3.61z\" fill=\"#fff\"/><path d=\"M13.52 5.86L13.52 9.46L16.63 8.33L16.63 4.72z\" fill=\"#fff\"/><path d=\"M10.45 4.74L13.52 5.86L13.52 9.46L10.45 8.35z\" fill=\"#fff\"/><path d=\"M7.4 8.65L4.28 9.78L7.35 10.9L7.35 14.51M9.2 10.23L9.4 10.16M8.65 9.1L8.45 9.03M4.46 15.6L4.27 15.67L1.2 14.55L4.28 13.39L4.28 9.78M10.48 6.13L7.37 7.26L10.44 8.38L10.63 8.31M22.8 13.38L22.8 9.77L19.68 10.9L19.68 14.54L22.8 13.41L22.8 17.02L19.68 18.15L19.72 14.53L16.6 15.67L16.63 19.26L13.52 20.39L13.52 13.11L13.55 9.49L10.48 8.37L7.37 9.5L10.44 10.63L10.44 11.99L10.48 15.62M7.55 13.07L7.35 13.14L4.28 12.03L7.37 10.87L7.37 7.26M4.28 19.28L7.35 20.39L7.35 16.79L4.27 15.67L4.27 19.27L1.2 18.16L1.2 14.55M19.49 7.19L19.68 7.26L19.72 10.89L16.6 12.02L16.63 15.65L13.55 16.77L10.44 17.87L10.44 14.26L7.35 13.14L7.35 16.75L10.44 17.91L10.44 21.52L13.55 20.38M4.28 15.63L4.28 12.03M16.6 19.27L19.72 18.14M10.44 21.52L7.37 20.4M16.62 6.14L16.62 9.75M19.73 8.61L19.73 5.01L22.8 6.12L16.6 8.38L16.6 11.99L13.52 13.14L13.36 13.06M22.8 9.73L22.8 6.12M13.53 3.62L16.6 4.74L19.72 3.6L16.65 2.48L10.45 4.74L10.45 8.35M13.56 7.21L13.52 5.86L16.6 4.74L16.6 8.34L13.52 9.5L10.44 10.62L10.44 14.23L13.55 13.13M19.72 7.21L19.72 3.6M13.42 16.72L13.52 16.75M16.63 15.62L16.54 15.58M7.37 13.11L7.37 9.5M10.45 4.74L13.52 5.86L13.52 9.46\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"#000\" stroke-width=\"0.75\"/><path d=\"M13.96 7.23a0.72 0.5 0 1 0 1.44 0a0.72 0.5 0 1 0 -1.44 0z\" fill=\"#000\"/></mask><mask id=\"pypi-rest\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"24\" height=\"24\"><rect width=\"24\" height=\"24\" fill=\"#fff\"/><path d=\"M4.28 9.78L7.35 10.9L10.47 9.77L7.4 8.65z\" fill=\"#fff\"/><path d=\"M4.28 9.78L7.35 10.9L7.35 14.51L4.28 13.39z\" fill=\"#fff\"/><path d=\"M7.37 7.26L10.44 8.38L13.55 7.24L10.48 6.13z\" fill=\"#fff\"/><path d=\"M7.37 7.26L10.44 8.38L10.44 11.99L7.37 10.87z\" fill=\"#fff\"/><path d=\"M1.2 14.55L4.27 15.67L7.38 14.53L4.32 13.41z\" fill=\"#fff\"/><path d=\"M1.2 14.55L4.27 15.67L4.27 19.27L1.2 18.16z\" fill=\"#fff\"/><path d=\"M4.28 15.67L7.35 16.79L7.35 20.39L4.28 19.28z\" fill=\"#fff\"/><path d=\"M4.28 12.03L7.35 13.14L10.47 12.01L7.4 10.89z\" fill=\"#fff\"/><path d=\"M4.28 12.03L7.35 13.14L7.35 16.75L4.28 15.63z\" fill=\"#fff\"/><path d=\"M19.68 14.54L19.68 18.15L22.8 17.02L22.8 13.41z\" fill=\"#fff\"/><path d=\"M16.6 15.67L16.6 19.27L19.72 18.14L19.72 14.53z\" fill=\"#fff\"/><path d=\"M13.52 16.79L13.52 20.39L16.63 19.26L16.63 15.65z\" fill=\"#fff\"/><path d=\"M10.44 17.91L10.44 21.52L13.55 20.38L13.55 16.77z\" fill=\"#fff\"/><path d=\"M7.37 16.79L10.44 17.91L10.44 21.52L7.37 20.4z\" fill=\"#fff\"/><path d=\"M19.68 10.9L19.68 14.51L22.8 13.38L22.8 9.77z\" fill=\"#fff\"/><path d=\"M16.62 6.14L16.62 9.75L19.73 8.61L19.73 5.01z\" fill=\"#000\"/><path d=\"M16.62 6.14L19.68 7.26L22.8 6.12L19.73 5.01z\" fill=\"#fff\"/><path d=\"M19.68 7.26L19.68 10.87L22.8 9.73L22.8 6.12z\" fill=\"#fff\"/><path d=\"M16.6 12.02L16.6 15.63L19.72 14.5L19.72 10.89z\" fill=\"#fff\"/><path d=\"M16.6 8.38L16.6 11.99L19.72 10.85L19.72 7.24z\" fill=\"#000\"/><path d=\"M13.53 3.62L16.6 4.74L19.72 3.6L16.65 2.48z\" fill=\"#000\"/><path d=\"M16.6 4.74L16.6 8.34L19.72 7.21L19.72 3.6z\" fill=\"#000\"/><path d=\"M10.45 15.63L13.52 16.75L16.63 15.62L13.56 14.5z\" fill=\"#000\"/><path d=\"M13.52 13.14L13.52 16.75L16.63 15.62L16.63 12.01z\" fill=\"#fff\"/><path d=\"M13.52 9.5L13.52 13.11L16.63 11.97L16.63 8.37z\" fill=\"#000\"/><path d=\"M10.48 12.01L13.55 13.13L13.55 16.74L10.48 15.62z\" fill=\"#000\"/><path d=\"M10.44 14.26L10.44 17.87L13.55 16.74L13.55 13.13z\" fill=\"#000\"/><path d=\"M7.37 13.15L10.44 14.26L10.44 17.87L7.37 16.76z\" fill=\"#000\"/><path d=\"M7.37 9.5L10.44 10.62L13.55 9.49L10.48 8.37z\" fill=\"#000\"/><path d=\"M10.44 10.62L10.44 14.23L13.55 13.09L13.55 9.49z\" fill=\"#000\"/><path d=\"M7.37 9.5L10.44 10.62L10.44 14.23L7.37 13.11z\" fill=\"#000\"/><path d=\"M10.45 4.74L10.45 8.35L13.56 7.21L13.56 3.61z\" fill=\"#000\"/><path d=\"M10.45 4.74L13.52 5.86L16.63 4.72L13.56 3.61z\" fill=\"#000\"/><path d=\"M13.52 5.86L13.52 9.46L16.63 8.33L16.63 4.72z\" fill=\"#000\"/><path d=\"M10.45 4.74L13.52 5.86L13.52 9.46L10.45 8.35z\" fill=\"#000\"/></mask><rect width=\"24\" height=\"24\" fill=\"currentColor\" mask=\"url(#pypi-snake)\"/><g mask=\"url(#pypi-rest)\"><path d=\"M7.4 8.65L4.28 9.78L7.35 10.9L7.35 14.51M9.2 10.23L9.4 10.16M8.65 9.1L8.45 9.03M4.46 15.6L4.27 15.67L1.2 14.55L4.28 13.39L4.28 9.78M10.48 6.13L7.37 7.26L10.44 8.38L10.63 8.31M22.8 13.38L22.8 9.77L19.68 10.9L19.68 14.54L22.8 13.41L22.8 17.02L19.68 18.15L19.72 14.53L16.6 15.67L16.63 19.26L13.52 20.39L13.52 13.11L13.55 9.49L10.48 8.37L7.37 9.5L10.44 10.63L10.44 11.99L10.48 15.62M7.55 13.07L7.35 13.14L4.28 12.03L7.37 10.87L7.37 7.26M4.28 19.28L7.35 20.39L7.35 16.79L4.27 15.67L4.27 19.27L1.2 18.16L1.2 14.55M19.49 7.19L19.68 7.26L19.72 10.89L16.6 12.02L16.63 15.65L13.55 16.77L10.44 17.87L10.44 14.26L7.35 13.14L7.35 16.75L10.44 17.91L10.44 21.52L13.55 20.38M4.28 15.63L4.28 12.03M16.6 19.27L19.72 18.14M10.44 21.52L7.37 20.4M16.62 6.14L16.62 9.75M19.73 8.61L19.73 5.01L22.8 6.12L16.6 8.38L16.6 11.99L13.52 13.14L13.36 13.06M22.8 9.73L22.8 6.12M13.53 3.62L16.6 4.74L19.72 3.6L16.65 2.48L10.45 4.74L10.45 8.35M13.56 7.21L13.52 5.86L16.6 4.74L16.6 8.34L13.52 9.5L10.44 10.62L10.44 14.23L13.55 13.13M19.72 7.21L19.72 3.6M13.42 16.72L13.52 16.75M16.63 15.62L16.54 15.58M7.37 13.11L7.37 9.5M10.45 4.74L13.52 5.86L13.52 9.46\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke=\"currentColor\" stroke-width=\"1\"/><path d=\"M17.84 16.76a0.72 0.5 0 1 0 1.44 0a0.72 0.5 0 1 0 -1.44 0z\" fill=\"currentColor\"/></g>"
  },
  "eco-cargo": {
    "stroke": "M22.23 16.89L12 22.8L12 20.95L22.23 15.05L22.23 16.89M12 20.95L1.77 15.05L1.77 16.89L12 22.8M19.99 13.75L22.23 15.05M1.77 15.05L4.01 13.75M19.99 10.43L12 15.05L12 10.43L16 8.12L16 17.35L19.99 15.05L19.99 5.82L16 8.12L12 5.82L16 3.51L12 1.2L8 3.51L12 5.82L8 8.12L12 10.43M8 3.51L8 12.74L12 15.05L12 19.66L16 17.35M16 3.51L19.99 5.82M4.01 15.05L8 17.35L8 12.74L4.01 10.43L4.01 15.05M4.01 10.43L8 8.12M8 17.35L12 19.66",
    "fill": ""
  }
}
const FILE_ICONS = ['eco-pypi', 'eco-gomod', 'eco-cargo', 'rust', 'pypy', ...Object.keys(GROUP_ICONS).map((id) => `group-${id}`)]
export const iconFiles = () =>
  Object.fromEntries(FILE_ICONS.map((id) => [id, inlineSvg(id).replace('<svg class="ico"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/ style="transform:scale\([\d.]+\)"/, '').replaceAll('currentColor', '#000')]))

// Every mark as a file, for places that draw icons from data in the browser
// (search results), where they are shown as plain images. `iconScales` is
// the optical correction each needs there, as the inline marks get in a style.
export const iconFile = (id) => {
  const svg = inlineSvg(id)
  return svg ? svg.replace('<svg class="ico"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/ style="transform:scale\([\d.]+\)"/, '').replaceAll('currentColor', '#000') : null
}
export const iconScales = OPTICAL

// For page text: one colour, following the text around it.
export function inlineIcon(id) {
  if (!FILE_ICONS.includes(id)) return inlineSvg(id)
  const scale = OPTICAL[id] ? `;transform:scale(${OPTICAL[id]})` : ''
  return `<span class="ico ico-file" style="--src:url(/icons/${id}.svg)${scale}" aria-hidden="true"></span>`
}

function inlineSvg(id) {
  // YJIT publishes its logo only as a bitmap (kept for the labels, where the
  // wordmark is shown). Beside text the diamond is redrawn here as lines, so
  // it stays sharp at any size.
  if (id === 'ruby-yjit') return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.500 4h9l4.500 5.500L12 21 3 9.500zM3 9.500h18M7.500 4l2 5.500L12 4l2.500 5.500 2-5.500M9.500 9.500L12 21l2.500-11.500" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round" stroke-linecap="round"/></svg>`
  // PyPI and crates.io: their marks are shaded pictures of stacked boxes,
  // which turn to mush at text size. Beside text they are line drawings of
  // the same shapes: PyPI traced over its logo, cube by cube, so the two
  // snakes and their eyes remain; Cargo's crates on their pallet.
  if (BOX_ICONS[id]?.body) return `<svg class="ico"${scaled(id)} viewBox="0 0 24 24" aria-hidden="true">${BOX_ICONS[id].body}</svg>`
  if (BOX_ICONS[id]) return `<svg class="ico"${scaled(id)} viewBox="0 0 24 24" aria-hidden="true"><path d="${BOX_ICONS[id].stroke}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  if (id.startsWith('group-')) return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${GROUP_ICONS[id.slice(6)]}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  if (LINE_ART[id]) return lineArt(id)
  if (id === 'eco-npm') return npmIcon()
  if (id === 'eco-pypi') return pypiIcon()
  const mark = ICONS[id]
  return mark ? `<svg class="ico"${scaled(id)} viewBox="0 0 24 24" aria-hidden="true"><path d="${mark.path}" fill="currentColor"/></svg>` : ''
}

// Assistants a page can be opened in, one colour like the other inline marks.
// Z.ai has no mark in either icon set, so it gets a plain letter in a box.
const ASSISTANT_LOGOS = { chatgpt: 'openai-icon', claude: 'claude-icon', grok: 'grok-icon' }
const ASSISTANT_MARKS = { perplexity: siPerplexity, deepseek: siDeepseek, kimi: siKimi, zai: { path: 'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm3.500 4.500v2.600h5.400L7 15.600v1.900h10v-2.600h-5.800L17 8.400V6.500z' } }
export function assistantIcon(id) {
  if (ASSISTANT_MARKS[id]) return `<svg class="ico" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="${ASSISTANT_MARKS[id].path}"/></svg>`
  const mark = logos.icons[ASSISTANT_LOGOS[id]]
  const body = mark.body.replace(/\sfill="[^"]*"/g, '')
  return `<svg class="ico" viewBox="0 0 ${mark.width ?? logos.width} ${mark.height ?? logos.height}" fill="currentColor" aria-hidden="true">${body}</svg>`
}
