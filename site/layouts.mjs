// Other shapes of the label, for places the full one does not fit: a compact
// label, a wide one, a one-line badge for a README and a small 88 by 31
// button. Each shows one result; the badge carries all three of its classes,
// each beside its name. They are files of their own, meant to be embedded elsewhere,
// so they do not rely on the site's typeface being loaded: every line of text
// is given the width it must take.
import { labelIcon } from './icons.mjs'
import { megabytes } from './units.mjs'
import { CLASSES, LEAST, RANKINGS, asInstalled, classColor, collectorFree, formatAtLeast, formatBytes, formatNumber, inkOn, labelSite, metricFor, previousVersion, shownValue, resultShortLink, shortLinkOf } from './label.mjs'

// Names and big figures are set at 80% width, as on the full label; a face
// without that axis draws them at its normal width.
const FACE = "Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif"
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)
// Text that may not run past `width`: a renderer without the typeface squeezes
// it instead of letting it overflow.
const fitted = (text, perChar, width) => (text.length * perChar > width ? ` textLength="${width}" lengthAdjust="spacingAndGlyphs"` : '')
const MARK = [0, 1, 3, 5, 6].map((i) => RANKINGS.cpu.colors[i])

// The site's mark: five bars, 26 by 20 at scale 1.
// `colors` is a ranking's seven class colours, for a mark in that scale.
function mark(x, y, scale, pointer = '#000', colors = RANKINGS.cpu.colors) {
  const row = 4, tip = row * 0.4
  return `<g transform="translate(${x} ${y}) scale(${scale})">${[0, 1, 3, 5, 6].map((c) => colors[c]).map((color, i) => `<path d="M0 ${i * row}h${10 + 2.25 * i}l2 ${tip}-2 ${tip}H0z" fill="${color}"/>`).join('')}<path d="M16.25 ${tip}l2-${tip}H26v${2 * tip}H18.25z" fill="${pointer}"/></g>`
}

// The wrench that marks a tuned entry (Material Icons "build", Apache 2.0), 24 units square.
const WRENCH = 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z'
const wrench = (x, y, size, fill = '#fff') => `<path d="${WRENCH}" fill="${fill}" transform="translate(${x} ${y}) scale(${(size / 24).toFixed(3)})"/>`
// A fall is good news for every figure: a triangle pointing down in the scale's
// best colour, or up in its worst. `size` is its width.
const triangle = (x, y, size, down, fill = down ? '#00843f' : '#d2191f') => `<path d="${down ? `M${x} ${y}h${size}l${-size / 2} ${size * 0.8}z` : `M${x} ${y + size * 0.8}h${size}l${-size / 2} ${-size * 0.8}z`}" fill="${fill}"/>`

// What the full label says besides the figure: whether the entry is tuned,
// and how it compares with the package at its default settings (for a tuned
// entry) or with its previous measured version.
// A runtime's summary (`summary`) is compared with nothing.
function compare(entry, runtime, rankingId, summary) {
  if (summary) return { tuned: false, ghost: null, text: null, short: null, down: null }
  const tuned = (entry.adapter?.tags ?? []).includes('non-default-options')
  const installed = asInstalled(entry, runtime, rankingId)
  const other = installed ?? previousVersion(entry, runtime, rankingId)
  const was = other?.grades[rankingId]
  const moved = was && was.value > 0 ? entry.grades[rankingId].value / was.value - 1 : null
  if (moved === null) return { tuned, ghost: null, text: null, short: null, down: null }
  const than = installed ? 'default settings' : `version ${other.version}`, same = Math.abs(moved) < 0.005, percent = `${Math.round(Math.abs(moved) * 100)}%`
  return {
    tuned,
    ghost: was.class !== entry.grades[rankingId].class ? was.class : null,
    words: installed ? ['DEFAULT', 'SETTINGS'] : ['PREVIOUS', 'VERSION'],
    text: same ? `${installed ? 'Tuned: same as' : 'Unchanged from'} ${than}` : `${installed ? 'Tuned: ' : ''}${percent} ${moved < 0 ? 'lower' : 'higher'} than ${than}`,
    short: same ? null : percent,
    down: same ? null : moved < 0,
  }
}
// The comparison as a centred line: triangle, then text.
function changeLine(change, centre, y, size, perChar) {
  if (!change.text) return ''
  const width = change.text.length * perChar, lead = change.down === null ? 0 : size * 0.95, x = centre - (width + lead) / 2
  return `${change.down === null ? '' : triangle(x, y - size * 0.72, size * 0.7, change.down)}<text x="${(x + lead).toFixed(1)}" y="${y}" font-size="${size}" font-weight="600" textLength="${width.toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(change.text)}</text>`
}

// What stands in place of a class letter: R for a reference entry, a stroke
// where there is nothing to compare the entry with.
const letterOf = (grade) => grade.class ?? (grade.reference ? 'R' : '/')
const classSaid = (grade) => grade.class ? `class ${grade.class}` : grade.reference ? 'reference, not graded' : 'no class'

// A class scale with its pointer, at any size. A letter that is not a class
// (see letterOf) is set in an outlined box beside the middle of the scale. `right` is where the pointer
// ends. `change` adds the wrench of a tuned entry and, where the entry it is
// compared with was in another class, that class's pointer as an outline.
function scale(rankingId, letter, { x, y, row, gap, first, step, right, pointer }, change = {}) {
  const tip = row * 0.42
  const rows = CLASSES.map((name, i) => {
    const top = y + i * (row + gap), length = first + i * step, color = classColor(rankingId, name)
    return `<path d="M${x} ${top}h${length}l${tip} ${row / 2}l${-tip} ${row / 2}H${x}z" fill="${color}"/><text x="${x + row * 0.32}" y="${top + row * 0.76}" font-size="${(row * 0.72).toFixed(1)}" font-weight="800" fill="${inkOn(color)}">${name}</text>`
  })
  const h = row + 3, nose = h * 0.42, body = pointer - nose
  if (change.ghost) {
    const top = y + CLASSES.indexOf(change.ghost) * (row + gap) - 1.5, size = h * 0.3
    rows.push(`<path d="M${right - 0.5} ${top + 0.5}H${right - pointer + nose}l${-nose + 0.6} ${h / 2 - 0.5}l${nose - 0.6} ${h / 2 - 0.5}H${right - 0.5}z" fill="#fff" stroke="#8a8a8a" stroke-dasharray="2.500 2" stroke-linejoin="round"/>`
      + change.words.map((word, i) => `<text x="${right - body / 2 - 1}" y="${(top + h / 2 - 0.4 + i * (size + 0.6)).toFixed(1)}" font-size="${size.toFixed(1)}" font-weight="700" fill="#6f6f6f" text-anchor="middle" textLength="${(body - 6).toFixed(1)}" lengthAdjust="spacingAndGlyphs">${word}</text>`).join(''))
  }
  if (!CLASSES.includes(letter)) {
    const side = h, left = right - side, top = y + 3 * (row + gap) + row / 2 - side / 2
    rows.push(`<rect x="${(left + 0.6).toFixed(1)}" y="${(top + 0.6).toFixed(1)}" width="${(side - 1.2).toFixed(1)}" height="${(side - 1.2).toFixed(1)}" fill="#fff" stroke="#000" stroke-width="1.200"/><text x="${(left + side / 2).toFixed(1)}" y="${(top + side * 0.76).toFixed(1)}" font-size="${(side * 0.7).toFixed(1)}" font-weight="800" fill="#000" text-anchor="middle">${letter}</text>`)
    return rows.join('')
  }
  const top = y + CLASSES.indexOf(letter) * (row + gap) - 1.5, icon = h * 0.6
  rows.push(`<path d="M${right} ${top}H${right - pointer + nose}l${-nose} ${h / 2}l${nose} ${h / 2}H${right}z" fill="#000"/><text x="${right - body / 2 - (change.tuned ? icon * 0.55 : 0)}" y="${top + h * 0.77}" font-size="${(h * 0.78).toFixed(1)}" font-weight="800" fill="#fff" text-anchor="middle">${letter}</text>${change.tuned ? wrench(right - body / 2 + icon * 0.15, top + (h - icon) / 2, icon) : ''}`)
  return rows.join('')
}

const figureOf = (entry, data, rankingId) => {
  const metric = metricFor(data, entry, rankingId)
  return { text: formatAtLeast(shownValue(metric, entry.grades[rankingId].value), LEAST[rankingId]), unit: metric.displayUnit === '×' ? '' : (metric.displayUnit ?? '') }
}
// `summary` marks a runtime's summary label in place of one result's: it
// carries the label's own lines (`context`, `subtitle`) and its page (`address`).
const measured = (rankingId, data, entry, summary, runtime) => collectorFree(runtime, summary ? metricFor(data, entry, rankingId).headline : ({ cpu: data.task.kind === 'server-startup' ? 'CPU to start' : `CPU per ${data.task.kind === 'http-server' ? 'request' : 'operation'}`, memory: 'memory after GC, above baseline', types: 'type-check cost' })[rankingId])
const versionOf = (entry, runtime) => (entry.builtin ? `Built into ${runtime.title}` : entry.version ? `Version ${entry.version}` : '')
const summaryOf = (entry) => Object.keys(RANKINGS).filter((id) => entry.grades[id]).map((id) => `${RANKINGS[id].title} ${letterOf(entry.grades[id])}`).join(', ')
// The link on a shape turns blue when pointed at, as it does on the full label.
const open = (width, height, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}" font-family="${FACE}">`
const linkOf = (data, runtime, entry, summary) => (!labelSite.host ? '' : summary ? shortLinkOf(summary.address) : resultShortLink(data.task.id, runtime.id, entry))

// A small label: name, scale, figure. 180 wide.
export function compactLabel({ entry, data, runtime, rankingId, summary }) {
  const grade = entry.grades[rankingId]
  if (!grade) return null
  const W = 180, figure = figureOf(entry, data, rankingId), link = linkOf(data, runtime, entry, summary), change = compare(entry, runtime, rankingId, summary)
  const title = cut(entry.title, 22), meta = cut(summary ? `${runtime.version}, ${summary.context}` : `${entry.version ?? 'built in'}, ${runtime.title} ${runtime.version}`, 34)
  const more = change.text ? 12 : 0, H = (link ? 236 : 218) + more
  return `${open(W, H, `${entry.title}: ${classSaid(grade)} for ${RANKINGS[rankingId].title}. ${summary ? summary.context : `${data.task.title}, ${runtime.title} ${runtime.version}`}.${change.text ? ` ${change.text}.` : ''}`)}
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="5" fill="#fff" stroke="#000" stroke-width="1.5"/>
<text x="10" y="21" font-size="15" font-weight="800" style="font-stretch:80%"${fitted(title, 8.2, W - 20)}>${esc(title)}</text>
<text x="10" y="35" font-size="9.5" font-weight="500"${fitted(meta, 4.9, W - 20)}>${esc(meta)}</text>
<path d="M0 43.5H${W}" stroke="#000"/>
${scale(rankingId, letterOf(grade), { x: 10, y: 52, row: 13, gap: 2.5, first: 44, step: 11, right: W - 10, pointer: 40 }, change)}
<path d="M0 166.500H${W}" stroke="#000"/>
<text x="${W / 2}" y="193" font-size="25" font-weight="800" style="font-stretch:80%" text-anchor="middle">${esc(figure.text)}${figure.unit ? `<tspan dx="3" font-size="12" font-weight="600">${esc(figure.unit)}</tspan>` : ''}</text>
<text x="${W / 2}" y="207" font-size="9.5" font-weight="500" text-anchor="middle">${esc(measured(rankingId, data, entry, summary, runtime))}</text>
${changeLine(change, W / 2, 219, 8.5, Math.min(4.3, (W - 34) / (change.text?.length ?? 1)))}
${link ? `<path d="M0 ${215.5 + more}H${W}" stroke="#000"/>${mark(10, 221 + more, 0.45)}<a href="${esc(link)}"><text x="27" y="${229 + more}" font-size="8.500" font-weight="600" text-decoration="underline"${fitted(link, 4.4, W - 37)} style="font-stretch:88%">${esc(link)}</text></a>` : ''}
</svg>`
}

// A label lying down: what it is and its figure on the left, the scale on the
// right. 520 by 152.
export function wideLabel({ entry, data, runtime, rankingId, summary }) {
  const grade = entry.grades[rankingId]
  if (!grade) return null
  const W = 520, H = 152, figure = figureOf(entry, data, rankingId), link = linkOf(data, runtime, entry, summary), change = compare(entry, runtime, rankingId, summary)
  const title = cut(entry.title, 26), context = cut(summary ? summary.context : `${rankingId === 'types' ? 'Type check' : data.task.title}, ${runtime.title} ${runtime.version}`, 46)
  return `${open(W, H, `${entry.title}: ${classSaid(grade)} for ${RANKINGS[rankingId].title}, ${figure.text} ${figure.unit} ${measured(rankingId, data, entry, summary, runtime)}. ${summary ? summary.context : `${data.task.title}, ${runtime.title} ${runtime.version}`}.${change.text ? ` ${change.text}.` : ''}`)}
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="6" fill="#fff" stroke="#000" stroke-width="1.5"/>
<text x="14" y="27" font-size="20" font-weight="800" style="font-stretch:80%"${fitted(title, 11, 262)}>${esc(title)}</text>
<text x="14" y="43" font-size="11" font-weight="500">${esc(summary ? summary.subtitle : versionOf(entry, runtime))}</text>
<text x="14" y="57" font-size="11" font-weight="500"${fitted(context, 5.6, 262)}>${esc(context)}</text>
<text x="14" y="${change.text ? 93 : 98}" font-size="36" font-weight="800" style="font-stretch:80%">${esc(figure.text)}${figure.unit ? `<tspan dx="4" font-size="16" font-weight="600">${esc(figure.unit)}</tspan>` : ''}</text>
<text x="14" y="${change.text ? 106 : 114}" font-size="11" font-weight="500">${esc(measured(rankingId, data, entry, summary, runtime))}</text>
${change.text ? `${change.down === null ? '' : triangle(14, 111.500, 7.500, change.down)}<text x="${change.down === null ? 14 : 25}" y="119" font-size="10.500" font-weight="600"${fitted(change.text, 5.4, 250)}>${esc(change.text)}</text>` : ''}
<path d="M290.500 0V${H - 26}" stroke="#000"/>
${scale(rankingId, letterOf(grade), { x: 302, y: 11, row: 12, gap: 3.500, first: 62, step: 14, right: W - 12, pointer: 44 }, change)}
<path d="M0 ${H - 26.5}H${W}" stroke="#000"/>
${mark(14, H - 20, 0.6)}<text x="36" y="${H - 9.500}" font-size="11" font-weight="800" style="font-stretch:88%">${esc(labelSite.name)}</text>
${link ? `<a href="${esc(link)}"><text x="${W - 14}" y="${H - 9.500}" font-size="11" font-weight="600" text-anchor="end" text-decoration="underline" style="font-stretch:88%">${esc(link)}</text></a>` : ''}
</svg>`
}

// One line for a README, drawn the way the badges there are (the shields.io
// conventions): 20 high, Verdana at 11px, a grey cell for each name and a
// coloured one for its class. `shaded` is their default look, with rounded
// corners, a faint gradient and a shadow under the text; without it the badge
// is their flat, square one.
const VERDANA = 'Verdana,Geneva,DejaVu Sans,sans-serif'
// Verdana's advance widths at 11px, near enough to lay cells out; each text
// is then given exactly that width, so another typeface cannot overflow.
const verdana = (text) => [...text].reduce((w, c) => w + (/[ilj.,' |]/.test(c) ? 3.2 : /[ftrI]/.test(c) ? 4.4 : /[mw]/.test(c) ? 10.4 : /[MW]/.test(c) ? 10.6 : /[A-Z]/.test(c) ? 7.7 : 6.6), 0)
// `only` names one measure, for a badge of that class alone.
export function badge({ entry, runtime, shaded = true, summary, only }) {
  if (only && !entry.grades[only]) return null
  const H = 20, CHIP = 14
  const tuned = (entry.adapter?.tags ?? []).includes('non-default-options')
  const said = []
  // Everything sits on the grey of a badge's name cell. Each class is a small
  // square in its colour after its name, not a cell of its own. A tuned
  // entry's wrench follows each square, in a black cell joined to it. How a figure moved against the entry
  // it is compared with is said in the title only: a bare triangle beside a
  // class reads as a menu.
  // The mark stands for the site, with no word beside it. On the badge of
  // one measure it wears that measure's colours.
  const parts = [{ text: '', logo: true }]
  for (const id of Object.keys(RANKINGS)) {
    if (!entry.grades[id] || (only && id !== only)) continue
    const change = compare(entry, runtime, id, summary)
    if (change.text) said.push(`${RANKINGS[id].title}: ${change.text}`)
    parts.push({ text: { cpu: 'CPU', memory: 'memory', types: 'types' }[id], letter: letterOf(entry.grades[id]), color: entry.grades[id].class ? classColor(id, entry.grades[id].class) : '#ffffff', down: change.down })
  }
  let x = 0
  const shapes = [], texts = []
  const say = (text, centre, y, fill, width, bold, opacity) => `<text x="${centre.toFixed(1)}" y="${y}" fill="${fill}"${opacity ? ` fill-opacity="${opacity}" aria-hidden="true"` : ''} text-anchor="middle" textLength="${width.toFixed(1)}" lengthAdjust="spacingAndGlyphs"${bold ? ' font-weight="bold" font-size="10"' : ''}>${text}</text>`
  for (const [i, part] of parts.entries()) {
    // Each name sits close to its own class and well clear of the one before
    // it, with a faint rule between, so it is plain which letter is whose.
    if (i > 1) { shapes.push(`<path d="M${(x + 7).toFixed(1)} 4v12" stroke="#fff" stroke-opacity=".28"/>`); x += 14 } else x += part.logo ? 5 : 7
    if (part.logo) { shapes.push(mark(x, 3.500, 0.65, '#fff', RANKINGS[only ?? 'cpu'].colors)); x += part.text ? 21 : 17 }
    const width = verdana(part.text)
    if (part.text && shaded) texts.push(say(part.text, x + width / 2, 15, '#010101', width, false, '.3'))
    if (part.text) texts.push(say(part.text, x + width / 2, 14, '#fff', width))
    x += width
    if (part.letter) {
      x += 3.5
      const ink = inkOn(part.color) === '#fff' ? '#fff' : '#333'
      // A tuned entry's wrench is a black cell joined to the square's right
      // side: the two share one outline, rounded only at its outer corners.
      const top = (H - CHIP) / 2, r = shaded ? 2 : 0, CELL = 13, whole = CHIP + (tuned ? CELL : 0)
      if (tuned) shapes.push(`<rect x="${x.toFixed(1)}" y="${top}" width="${whole}" height="${CHIP}" rx="${r}" fill="#000"/>`)
      shapes.push(tuned
        ? `<path d="M${(x + r).toFixed(1)} ${top}h${CHIP - r}v${CHIP}h${r - CHIP}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - CHIP}a${r} ${r} 0 0 1 ${r} ${-r}z" fill="${part.color}"/>`
        : `<rect x="${x.toFixed(1)}" y="${top}" width="${CHIP}" height="${CHIP}" rx="${r}" fill="${part.color}"/>`)
      texts.push(say(part.letter, x + CHIP / 2, 13.600, ink, 7.2, true))
      x += CHIP
      if (tuned) { shapes.push(wrench(x + 2, top + 2.5, 9)); x += CELL }
    }
  }
  const W = Math.round(x + 5), about = esc(`Package efficiency of ${entry.title}${tuned ? ', tuned' : ''}: ${only ? `${RANKINGS[only].title} ${letterOf(entry.grades[only])}` : summaryOf(entry)}${said.length ? `. ${said.join('; ')}` : ''}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${about}">
<title>${about}</title>
${shaded ? `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>` : ''}
<rect width="${W}" height="${H}" rx="${shaded ? 3 : 0}" fill="#555"/>
${shapes.join('')}
${shaded ? `<rect width="${W}" height="${H}" rx="3" fill="url(#s)"/>` : ''}
<g font-family="${VERDANA}" font-size="11" text-rendering="geometricPrecision">${texts.join('')}</g>
</svg>`
}

// The 88 by 31 button of old web pages: the scale, what was measured and one
// class. One class to a button: three letters in a row can spell a word.
export function button({ entry, runtime, rankingId, summary }) {
  const grade = entry.grades[rankingId]
  if (!grade) return null
  const name = { cpu: 'CPU', memory: 'MEMORY', types: 'TYPE CHECK' }[rankingId]
  // The pointer of a tuned entry is wider, to hold the wrench after its
  // letter; the words beside it give up the room. How the figure compares
  // with another entry is said in the title only: a bare percentage here has
  // nothing to say what it is a percentage of.
  const change = compare(entry, runtime, rankingId, summary)
  const body = change.tuned ? 64 : 71.5, room = body - 8.5 - 24 - 2.5
  return `${open(88, 31, `Package efficiency of ${entry.title}${change.tuned ? ', tuned' : ''}: ${classSaid(grade)} for ${RANKINGS[rankingId].title}${change.text ? `. ${change.text}` : ''}`)}
<rect x=".5" y=".5" width="87" height="30" fill="#fff" stroke="#000"/>
${RANKINGS[rankingId].colors.map((color, i) => `<path d="M3.500 ${3.5 + i * 3.5}h${7 + i * 1.7}l1.200 1.400l-1.200 1.400H3.500z" fill="${color}"/>`).join('')}
<text x="24" y="12.500" font-size="6" font-weight="800" letter-spacing=".3" textLength="${room}" lengthAdjust="spacingAndGlyphs">EFFICIENCY</text>
<text x="24" y="22.500" font-size="7.500" font-weight="800"${fitted(name, 5.2, room)}>${name}</text>
${grade.class ? '' : `<rect x="64" y="5" width="21" height="21" fill="#fff" stroke="#000" stroke-width="1.500"/><text x="74.500" y="21" font-size="15" font-weight="800" text-anchor="middle">${letterOf(grade)}</text>`}${!grade.class ? '' : `<path d="M85 4.500H${body}L${body - 8.5} 15.500l8.500 11H85z" fill="#000"/>`}${!grade.class ? '' : change.tuned ? `<text x="68.800" y="21.500" font-size="16" font-weight="800" fill="#fff" text-anchor="middle">${grade.class}</text>${wrench(74.800, 10.700, 9)}` : `<text x="76.500" y="21.500" font-size="16" font-weight="800" fill="#fff" text-anchor="middle">${grade.class}</text>`}
</svg>`
}

// All three measures on one label, laid out like a bento box: CPU fills the
// left half, and memory and type check share the right half, one above the
// other (memory takes the whole of it for an entry with no type-check cost).
// 460 by 338.
export function overviewLabel({ entry, data, runtime, summary }) {
  if (!entry.grades.cpu) return null
  // Import time and size on disk have no class; they go in the header, under
  // the runtime's icon.
  const extras = summary ? [] : [
    entry.metrics?.importMs != null && [`${formatNumber(entry.metrics.importMs)} ms`, 'import'],
    entry.metrics?.installBytes != null && [formatBytes(entry.metrics.installBytes), entry.metrics.installKind === 'binary' ? 'in binary' : 'install'],
  ].filter(Boolean)
  const W = 460, HEAD = 60, BODY = 250, FOOT = 28, H = HEAD + BODY + FOOT, MID = W / 2
  const link = linkOf(data, runtime, entry, summary)
  const title = cut(entry.title, 34), sub = summary ? summary.subtitle : versionOf(entry, runtime)
  const context = cut(summary ? summary.context : `${data.task.title}, ${runtime.title} ${runtime.version}`, 72)
  const others = ['memory', 'types'].filter((id) => entry.grades[id])
  const short = { cpu: null, memory: 'above baseline', types: 'type-check cost' }
  const said = []
  // One measure in a box at (x, y). A tall box has the scale across it and
  // the figure underneath.
  const panel = (rankingId, x, y, w, h) => {
    const grade = entry.grades[rankingId], figure = figureOf(entry, data, rankingId), change = compare(entry, runtime, rankingId, summary)
    const what = summary || h > 200 ? measured(rankingId, data, entry, summary, runtime) : short[rankingId] ?? measured(rankingId, data, entry, summary, runtime)
    said.push(`${RANKINGS[rankingId].title} ${classSaid(grade)}, ${figure.text}${figure.unit ? ` ${figure.unit}` : ''}`)
    const name = `<text x="${x + 12}" y="${y + 19}" font-size="13" font-weight="800">${esc(RANKINGS[rankingId].title)}</text>`
    // A type-check cost is a product; the CPU time and memory it is made of go under it.
    const cost = rankingId === 'types' && !summary ? (entry.types?.compilers?.[data.typesCompiler] ?? entry.types) : null
    const parts = cost?.cpuMs != null && cost?.memoryBytes != null ? `${cost.cpuMs < 10 ? '< 10' : formatAtLeast(cost.cpuMs, 0)} ms CPU × ${formatAtLeast(megabytes(cost.memoryBytes), LEAST.memory)} MB` : null
    const number = (cx, base, size) => `<text x="${cx}" y="${base}" font-size="${size}" font-weight="800" style="font-stretch:80%" text-anchor="middle">${esc(figure.text)}${figure.unit ? `<tspan dx="${(size * 0.1).toFixed(1)}" font-size="${(size * 0.45).toFixed(1)}" font-weight="600">${esc(figure.unit)}</tspan>` : ''}</text>`
    const partsLine = (cx, base, size, room) => (parts ? `<text x="${cx}" y="${base}" font-size="${size}" font-weight="500" fill="#444" text-anchor="middle"${fitted(parts, size * 0.5, room)}>${esc(parts)}</text>` : '')
    if (h > 200) {
      // The figure sits midway between the scale and what is under it: lower
      // when there is no change line below.
      const drop = change.text ? 6 : 9
      return `${name}
${scale(rankingId, letterOf(grade), { x: x + 12, y: y + 28, row: 17, gap: 3.5, first: 55, step: 14, right: x + w - 12, pointer: 48 }, change)}
${number(x + w / 2, y + 203 + drop, 34)}
<text x="${x + w / 2}" y="${y + 219 + drop}" font-size="12" font-weight="500" text-anchor="middle"${fitted(what, 6.2, w - 24)}>${esc(what)}</text>
${partsLine(x + w / 2, y + 231 + drop, 10, w - 24)}
${changeLine(change, x + w / 2, y + h - 9, 10, Math.min(5.2, (w - 34) / (change.text?.length ?? 1)))}`
    }
    // A low box: the scale keeps its proportions at the left, and the figure
    // goes beside it.
    const split = x + 128, cx = split + (x + w - split) / 2, room = x + w - split - 10
    // A long figure is set smaller so that it fits beside the scale. It is
    // never given a forced width, which would stretch the letters.
    const unitWidth = figure.unit ? 2 + figure.unit.length * 6.4 : 0
    const size = Math.min(21, Math.floor(((room - unitWidth) / (figure.text.length * 0.64)) * 2) / 2)
    return `${name}
${scale(rankingId, letterOf(grade), { x: x + 12, y: y + 27, row: 9, gap: 2, first: 30, step: 8, right: split, pointer: 30 }, change)}
<text x="${cx}" y="${y + 64}" font-size="${size}" font-weight="800" style="font-stretch:80%" text-anchor="middle">${esc(figure.text)}${figure.unit ? `<tspan dx="2" font-size="10" font-weight="600">${esc(figure.unit)}</tspan>` : ''}</text>
<text x="${cx}" y="${y + 77}" font-size="9.5" font-weight="500" text-anchor="middle"${fitted(what, 4.8, room)}>${esc(what)}</text>
${partsLine(cx, y + 88, 8.5, room)}
${changeLine(change, x + w / 2, y + h - 7, 8.5, Math.min(4.3, (w - 34) / (change.text?.length ?? 1)))}`
  }
  const boxes = [panel('cpu', 0, HEAD, MID, BODY), ...others.map((id, i) => panel(id, MID, HEAD + (BODY / others.length) * i, MID, BODY / others.length))]
  return `${open(W, H, `${entry.title}: ${said.join('; ')}. ${context}.`)}
<rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="7" fill="#fff" stroke="#000" stroke-width="1.5"/>
<text x="14" y="25" font-size="21" font-weight="800" style="font-stretch:80%"${fitted(title, 11.7, W - 62)}>${esc(title)}</text>
<text x="14" y="40" font-size="11.5" font-weight="500">${esc(sub)}</text>
<text x="14" y="53" font-size="11.5" font-weight="500"${fitted(context, 5.9, W - 28 - (extras.length ? 96 : 0))}>${esc(context)}</text>
<path d="M0 ${HEAD}H${W}M0 ${HEAD + BODY}H${W}${others.length ? `M${MID} ${HEAD}V${HEAD + BODY}` : ''}${others.length > 1 ? `M${MID} ${HEAD + BODY / 2}H${W}` : ''}" stroke="#000" stroke-width="1.5" fill="none"/>
${boxes.join('\n')}
${labelIcon(runtime.id, W - 14 - 22, 7, 22)}
${extras.map(([value, name], i) => `<text x="${W - 14}" y="${42 + i * 12}" font-size="10" text-anchor="end"><tspan font-weight="700">${esc(value)}</tspan><tspan dx="3" font-weight="500">${esc(name)}</tspan></text>`).join('')}
${mark(14, H - 21, 0.6)}<text x="36" y="${H - 9.500}" font-size="11.5" font-weight="800" style="font-stretch:88%">${esc(labelSite.name)}</text>
${link ? `<a href="${esc(link)}"><text x="${W - 14}" y="${H - 9.500}" font-size="11.5" font-weight="600" text-anchor="end" text-decoration="underline" style="font-stretch:88%">${esc(link)}</text></a>` : ''}
</svg>`
}

// Every embeddable file for one result: [file name, SVG].
export function embedFiles(result) {
  const perRanking = Object.keys(RANKINGS).filter((id) => result.entry.grades[id])
  return [
    ['overview.svg', overviewLabel(result)],
    ['badge.svg', badge(result)],
    ['badge.flat.svg', badge({ ...result, shaded: false })],
    ...perRanking.flatMap((rankingId) => [[`badge.${rankingId}.svg`, badge({ ...result, only: rankingId })], [`badge.${rankingId}.flat.svg`, badge({ ...result, only: rankingId, shaded: false })]]),
    ...perRanking.map((rankingId) => [`button.${rankingId}.svg`, button({ ...result, rankingId })]),
    ...perRanking.map((rankingId) => [`compact.${rankingId}.svg`, compactLabel({ ...result, rankingId })]),
    ...perRanking.map((rankingId) => [`wide.${rankingId}.svg`, wideLabel({ ...result, rankingId })]),
  ]
}
