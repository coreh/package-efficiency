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
const OPTICAL = { 'eco-npm': 1.3, 'eco-jsr': 1.3, go: 1.4, 'eco-rubygems': 0.96, javascript: 0.86, typescript: 0.86, 'eco-gomod': 1.15, bun: 1.08, 'eco-cargo': 1.1, 'eco-pypi': 1.15 }
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
const FILE_ICONS = ['eco-pypi', 'eco-gomod', 'eco-cargo', 'rust', 'pypy']
export const iconFiles = () =>
  Object.fromEntries(FILE_ICONS.map((id) => [id, inlineSvg(id).replace('<svg class="ico"', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/ style="transform:scale\([\d.]+\)"/, '').replaceAll('currentColor', '#000')]))

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
