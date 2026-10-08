import { createHash } from 'node:crypto'
// The efficiency label as an SVG string. Used inline in pages and written out
// as standalone files. The layout borrows the structure of an appliance energy
// label (class arrows, pointer, headline figure, secondary figures) without
// reproducing any official label's marks.

import { labelIcon } from './icons.mjs'
import { megabytes, toDisplay } from './units.mjs'

export const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// Each ranking has its own colour ramp, so a label shows at a glance which
// one it belongs to. All run from light or green (best) to dark or red (worst).
export const RANKINGS = {
  cpu: {
    title: 'CPU',
    caption: 'CPU',
    colors: ['#00a651', '#50b848', '#bfd730', '#fff200', '#fdb913', '#f37021', '#ed1c24'],
  },
  memory: {
    title: 'Memory',
    caption: 'memory',
    colors: ['#ffc4c9', '#ffa5bf', '#f483bc', '#dc6dbd', '#ba61b8', '#965db3', '#755baa'],
  },
  types: {
    title: 'Type check',
    caption: 'type check',
    colors: ['#8fdcf0', '#5bbfe8', '#3a9be0', '#3f77d6', '#5557c9', '#6f3bb3', '#81228f'],
  },
}

// The metric behind a ranking for one entry. Type checking is measured with a
// different tool per language, each with its own scale.
export const metricFor = (data, entry, rankingId) =>
  rankingId === 'types' ? data.typeChecks[entry.types?.metricKey ?? (entry.ecosystem === 'cargo' ? 'cargo' : 'typescript')] : data.metrics[rankingId]

// What a label says of memory, for a runtime without a garbage collector:
// the same words with the collection left out.
export const collectorFree = (runtime, text) =>
  runtime?.garbageCollected === false
    ? text.replace(' after GC, above baseline', ' above baseline').replace(' after task and GC', ' after task').replace(' after the task and a garbage collection', ' after the task').replace(' after GC', '')
    : text

export const classColor = (rankingId, letter) => RANKINGS[rankingId].colors[CLASSES.indexOf(letter)]

// Black or white, whichever reads better on `hex`.
export function inkOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#000' : '#fff'
}

const WIDTH = 320
const ROW = 30
const GAP = 4
const NOTE_LINE = 15
// Every section of the label has the same space above and below its content,
// measured the way type is set when its leading is trimmed: from a rule to
// the top of the capitals of the first line, and from the last baseline (or
// the bottom of a shape) to the next rule. Sides are the same width.
const PAD = 14
const SIDE = 16
// Height of Archivo's capitals, as a share of the type size.
const CAP = 0.7

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export const formatNumber = (value) => {
  if (value === null || value === undefined) return 'n/a'
  if (value >= 100) return Math.round(value).toLocaleString('en-US')
  if (value >= 10) return value.toFixed(1)
  // Two digits that mean something, however small the figure.
  if (value > 0 && value < 0.1) return String(Number(value.toPrecision(2)))
  return value.toFixed(value < 1 ? 2 : 1)
}

// `width` is a number of characters, or a function giving it for each line
// (the first line of a title is shorter, to leave room for a mark beside it).
// A size in decimal units, as the memory figures are.
export const formatBytes = (bytes) => (bytes >= 999_500 ? `${formatNumber(bytes / 1e6)} MB` : bytes >= 1000 ? `${Math.round(bytes / 1e3)} kB` : `${bytes} B`)

// A figure too small to measure is shown as less than the smallest amount
// that can be told apart, not as zero: "< 0.001".
// A stored figure of a metric (ms, bytes) as the number its labels and tables
// show, in the metric's display unit. A multiple or a cost is shown as it is.
export const shownValue = (metric, value) => toDisplay(value, metric?.displayUnit)
export const LEAST = { cpu: 0.0001, memory: 0.01, types: 0.001 }
export const formatAtLeast = (value, least) => (value !== null && value !== undefined && least && value < least ? `< ${formatNumber(least)}` : formatNumber(value))

// How wide a title is, to place the review badge after it: the advance of
// each printable ASCII character in the title's face (Archivo 800 at 80%
// width), in thousandths of the size, measured in a browser. Anything else
// counts as an average letter.
const NAME_ADVANCES = [151,285,416,549,472,837,668,230,369,369,387,575,262,284,262,286,521,486,516,520,515,521,521,496,515,521,275,275,575,575,575,506,833,617,607,622,622,569,511,666,638,284,522,629,511,789,640,669,579,669,617,569,561,632,594,834,605,599,567,359,286,359,575,442,219,516,522,502,522,511,306,508,518,248,247,514,248,774,519,521,522,522,337,472,321,518,472,719,508,470,447,378,229,378,575]
const nameWidth = (text, size = 25) => ([...text].reduce((sum, ch) => sum + (NAME_ADVANCES[ch.charCodeAt(0) - 32] ?? 520), 0) * size) / 1000
// The marks of a reviewed benchmark, 16 units square: the package authors'
// badge with its white tick, and the mark of another person's review: a
// white figure raising a hand, in a grey circle. Not a tick, so the two cannot be confused.
const REVIEW_MARKS = {
  maintainer: { color: '#1a73e8', shape: 'M5.65 2.32Q8.00 -0.05 10.35 2.32Q13.69 2.31 13.68 5.65Q16.05 8.00 13.68 10.35Q13.69 13.69 10.35 13.68Q8.00 16.05 5.65 13.68Q2.31 13.69 2.32 10.35Q-0.05 8.00 2.32 5.65Q2.31 2.31 5.65 2.32z', tick: 'M11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z' },
  human: { color: '#6b7075', shape: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z', tick: 'M7.500 3.300a1.400 1.400 0 1 0 0 2.800 1.400 1.400 0 0 0 0-2.800zM6.100 6.500h2.650v6.600H7.900v-3.100h-.550v3.100H6.500V7.900h-.250v2.300H5.200V7.400a.900.900 0 0 1 .900-.900zM8.750 6.500h1.880a.550.550 0 0 1 0 1.100H8.750z', arm: 'M10.080 7.050V4.600h1.100v2.450a.550.550 0 0 1-1.100 0z' },
}

function wrap(text, width, breakWords = false) {
  const widthOf = typeof width === 'function' ? width : () => width
  const lines = ['']
  const words = text.split(/\s+/).flatMap(word => breakWords ? word.match(new RegExp(`.{1,${Math.min(widthOf(0), widthOf(1))}}`, 'gu')) ?? [] : [word])
  for (const word of words) {
    const last = lines.at(-1)
    if (last && last.length + word.length + 1 > widthOf(lines.length - 1)) lines.push(word)
    else lines[lines.length - 1] = last ? `${last} ${word}` : word
  }
  return lines
}

const SCALE_HEIGHT = 7 * ROW + 6 * GAP
// The wrench that marks a tuned entry (Material Icons "build", Apache 2.0).
const WRENCH_PATH = 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z'
function scale(rankingId, pointerClass, top, ghostClass, ghostWords = ['PREVIOUS', 'VERSION'], tuned = false, reference = null) {
  const rows = CLASSES.map((letter, i) => {
    const y = top + i * (ROW + GAP)
    const length = 74 + i * 21
    const color = classColor(rankingId, letter)
    const points = `16,${y} ${16 + length},${y} ${16 + length + 13},${y + ROW / 2} ${16 + length},${y + ROW} 16,${y + ROW}`
    return `<polygon points="${points}" fill="${color}"/><text x="26" y="${y + 21}" class="l-letter" fill="${inkOn(color)}">${letter}</text>`
  })
  const h = ROW + 6
  // Where the entry it is compared with stood (the previous version, or the
  // package as installed), when that was another class: the same pointer as
  // an outline.
  if (ghostClass && ghostClass !== pointerClass) {
    const y = top + CLASSES.indexOf(ghostClass) * (ROW + GAP) - 3
    rows.push(
      `<polygon points="${WIDTH - 17},${y + 1} ${WIDTH - 69.5},${y + 1} ${WIDTH - 86.5},${y + h / 2} ${WIDTH - 69.5},${y + h - 1} ${WIDTH - 17},${y + h - 1}" fill="#fff" stroke="#8a8a8a" stroke-width="1.5" stroke-dasharray="4 3" stroke-linejoin="round"/>`,
      `<text x="${WIDTH - 45.5}" y="${y + h / 2 - 2.5}" class="l-ghost" text-anchor="middle">${ghostWords[0]}</text><text x="${WIDTH - 45.5}" y="${y + h / 2 + 8.5}" class="l-ghost" text-anchor="middle">${ghostWords[1]}</text>`,
    )
  }
  // No class (nothing to compare the entry with): no pointer. A box with a
  // stroke through it stands where the pointer would be, beside the middle
  // of the scale.
  // A reference entry is not graded: no pointer. A box like the one for no
  // class stands beside the middle of the scale, with an R for reference.
  if (!pointerClass && reference !== null) {
    const side = 34, x = WIDTH - 16 - side, y = top + 3 * (ROW + GAP) + ROW / 2 - side / 2
    rows.push(`<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="#fff" stroke="#000" stroke-width="2"/><text x="${x + side / 2}" y="${y + 25}" class="l-pointer" style="fill:#000;font-size:23px" text-anchor="middle">R</text>`)
    return rows.join('')
  }
  if (!pointerClass) {
    const side = 34, x = WIDTH - 16 - side, y = top + 3 * (ROW + GAP) + ROW / 2 - side / 2
    rows.push(`<rect x="${x}" y="${y}" width="${side}" height="${side}" fill="#fff" stroke="#000" stroke-width="2"/><path d="M${x + 9} ${y + side - 9}L${x + side - 9} ${y + 9}" stroke="#000" stroke-width="2.500" stroke-linecap="round"/>`)
    return rows.join('')
  }
  const y = top + CLASSES.indexOf(pointerClass) * (ROW + GAP) - 3
  rows.push(
    `<polygon points="${WIDTH - 16},${y} ${WIDTH - 70},${y} ${WIDTH - 88},${y + h / 2} ${WIDTH - 70},${y + h} ${WIDTH - 16},${y + h}" fill="#000"/>`,
    // A tuned entry carries the wrench in its pointer, after the letter.
    tuned ? `<path d="${WRENCH_PATH}" fill="#fff" transform="translate(${WIDTH - 43} ${y + h / 2 - 9.6}) scale(0.8)"/>` : '',
    `<text x="${WIDTH - (tuned ? 55 : 44)}" y="${y + 27}" class="l-pointer" text-anchor="middle">${pointerClass}</text>`,
  )
  return rows.join('')
}

// The site's mark, small, at the end of the figures row: five class arrows in
// the CPU colours.
const MARK_COLORS = [0, 1, 3, 5, 6].map((i) => RANKINGS.cpu.colors[i])
// The site's logo, five bars and the pointer at the top one: 26 by 20 at
// scale 1.
function siteMark(x, y, scale = 1) {
  const row = 4, tip = row * 0.4
  const bars = MARK_COLORS.map((color, i) => `<path d="M0 ${i * row}h${10 + 2.25 * i}l2 ${tip}-2 ${tip}H0z" fill="${color}"/>`).join('')
  return `<g transform="translate(${x} ${y}) scale(${scale})">${bars}<path d="M16.25 ${tip}l2-${tip}H26v${2 * tip}H18.25z" fill="#000"/></g>`
}

// Where the label comes from, printed along its foot: the site's name and
// its address, which is a link to the page of the result the label shows.
// Set by the build from site.json.
export const labelSite = { name: 'Package Efficiency Labels', url: '', host: '', shortUrl: '' }
// The foot: the logo at the left, and beside it the site's name, the link
// and the caution, one under the other.
// The logo is as tall as the two lines beside it, from the capitals of the
// name to the baseline of the link.
const BY_SIZE = 14
const LINK_LINE = 19
const MARK_SCALE = (CAP * BY_SIZE + LINK_LINE) / 20
const FOOT_TEXT = SIDE + Math.round(26 * MARK_SCALE) + 8
const FOOT_ROOM = WIDTH - SIDE - FOOT_TEXT
const CAUTION_LINE = 13

// An address broken into lines at its slashes, each at most `width` long.
function addressLines(address, width) {
  const lines = ['']
  for (const part of address.split(/(?<=\/)/)) {
    if (lines.at(-1).length + part.length > width && lines.at(-1)) lines.push('')
    lines[lines.length - 1] += part
  }
  return lines
}

// The page of one result: one entry at one version on one runtime, in one
// task. Its address does not change when a newer version is measured.
// A short address for the same page: /r/ and a code of six or more
// characters, in digits and letters that are hard to misread (no i, l, o or
// u). The Worker sends it on to the page.
//
// A code is the start of a SHA-256 of the result's own address, as short as
// it can be without being taken. "Taken" is decided by a record of every code
// ever given out (data/short-links.json, kept in the repository): a result
// that has a code keeps it for good, and a new result gets the shortest start
// of its hash, six characters or more, that no earlier result holds. So codes
// never change or move to another result as more are added, and the same
// repository gives the same codes on any computer. Results new in the same
// build are given codes in the order of their addresses.
const SHORT_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'
const SHORT_MIN = 6
function shortHash(address) {
  let text = ''
  for (const byte of createHash('sha256').update(address).digest().subarray(0, 20)) text += byte.toString(2).padStart(8, '0')
  return text.match(/.{5}/g).map((bits) => SHORT_ALPHABET[parseInt(bits, 2)]).join('')
}
// `issued` is the record, code to address. Returns it extended with a code
// for each of `addresses` that has none yet.
export function issueShortLinks(issued, addresses) {
  const record = { ...issued }
  const held = new Set(Object.values(record))
  for (const address of [...new Set(addresses)].sort()) {
    if (held.has(address)) continue
    const hash = shortHash(address)
    let length = SHORT_MIN
    while (record[hash.slice(0, length)]) length++
    record[hash.slice(0, length)] = address
    held.add(address)
  }
  return record
}
// Set by the build once the record is read: address to code.
export const shortCodes = new Map()
export function resultShort(taskId, runtimeId, entry) {
  const code = shortCodes.get(resultPath(taskId, runtimeId, entry))
  return code ? `/r/${code}` : resultPath(taskId, runtimeId, entry)
}
// The short link in full, as printed on labels: on the short address if
// site.json names one (https://pe.example/<code>, which redirects to /r/<code>
// on the site), otherwise on the site itself.
// The same for any page that has a code, by its address.
export function shortLinkOf(address) {
  const code = shortCodes.get(address)
  return code ? (labelSite.shortUrl ? `${labelSite.shortUrl}/${code}` : `${labelSite.url}/r/${code}`) : `${labelSite.url}${address}`
}
export function resultShortLink(taskId, runtimeId, entry) {
  const code = shortCodes.get(resultPath(taskId, runtimeId, entry))
  return code && labelSite.shortUrl ? `${labelSite.shortUrl}/${code}` : `${labelSite.url}${resultShort(taskId, runtimeId, entry)}`
}
export const resultPath = (taskId, runtimeId, entry) => `/results/${taskId}/${runtimeId}/${entry.id.replace(/(?<=[^/])@[^/@]+$/, '')}${entry.version ? `@${entry.version}` : ''}/`

// A label opened as a file of its own has no page around it to load the
// typeface, so it asks for it itself.
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&amp;display=swap');"

// One of up to three secondary figures along the bottom of the label.
// The row of secondary figures. `top` is the top of the row: its chips start
// there. Up to three figures sit in fixed columns. Four are spaced by what
// each needs, at full size while that leaves a clear gap between them, and
// only as much smaller as it takes when it does not.
const FIGURES_HEIGHT = 37
// The unit of a type-check cost, after its number: a root sign with its bar
// drawn over kB·s, a little smaller and lighter than the figure.
// The unit beside the large number of a type-check label.
const BIG_UNIT = (unit) => `<tspan dx="0.14em" style="font-weight:600;font-size:0.44em;font-stretch:100%">${unit}</tspan>`
const FIGURE_SIZES = [
  { box: 20, size: 13.5, small: 12, inner: 6 },
  { box: 18, size: 12.5, small: 11.5, inner: 5 },
  { box: 16, size: 12, small: 11, inner: 4, narrow: true },
]
function figureRow(figures, top) {
  const room = WIDTH - 2 * SIDE
  const widthOf = (f, k) => Math.max((f.grade ? k.box + k.inner : 0) + f.text.length * k.size * (k.narrow ? 0.5 : 0.56), f.caption.length * k.small * 0.5)
  let k = FIGURE_SIZES[0]
  let starts = figures.map((_, i) => SIDE + i * 98)
  if (figures.length > 3) {
    k = FIGURE_SIZES.find((size) => (room - figures.reduce((sum, f) => sum + widthOf(f, size), 0)) / (figures.length - 1) >= 12) ?? FIGURE_SIZES.at(-1)
    const gap = (room - figures.reduce((sum, f) => sum + widthOf(f, k), 0)) / (figures.length - 1)
    let x = SIDE
    starts = figures.map((f) => { const at = x; x += widthOf(f, k) + gap; return at })
  }
  return figures.map(({ caption, text, rankingId, grade }, i) => {
    const x = starts[i]
    let chip = ''
    if (grade?.class) {
      const color = classColor(rankingId, grade.class)
      chip = `<rect x="${x.toFixed(1)}" y="${top + (20 - k.box) / 2}" width="${k.box}" height="${k.box}" fill="${color}"/><text x="${(x + k.box / 2).toFixed(1)}" y="${top + 15.5 - (20 - k.box) / 8}" class="l-chip" style="font-size:${k.box * 0.7}px" text-anchor="middle" fill="${inkOn(color)}">${grade.class}</text>`
    }
    // A reference entry: an outlined box with an R, as beside the scale.
    if (grade?.reference) {
      chip = `<rect x="${(x + 0.75).toFixed(2)}" y="${top + (20 - k.box) / 2 + 0.75}" width="${k.box - 1.5}" height="${k.box - 1.5}" fill="#fff" stroke="#000" stroke-width="1.500"/><text x="${(x + k.box / 2).toFixed(1)}" y="${top + 15.5 - (20 - k.box) / 8}" class="l-chip" style="font-size:${k.box * 0.7}px" text-anchor="middle" fill="#000">R</text>`
    }
    return `${chip}<text x="${(x + (grade ? k.box + k.inner : 0)).toFixed(1)}" y="${top + 16}" class="l-figure" style="font-size:${k.size}px${k.narrow ? ';font-stretch:86%' : ''}">${esc(text)}</text><text x="${x.toFixed(1)}" y="${top + FIGURES_HEIGHT}" class="l-caption" style="font-size:${k.small}px">${esc(caption)}</text>`
  }).join('')
}

const STYLE = `
.l-name{font:800 25px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:80%}
.l-meta{font:500 13px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-letter{font:800 19px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-pointer{font:800 26px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#fff}
.l-big{font:800 50px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:80%}
.l-unit{font:500 14px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}.l-parts{font:500 11.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#333}.l-ghost{font:700 8.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;letter-spacing:.06em;fill:#6f6f6f}.l-change{font:600 12.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-chip{font:800 14px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-figure{font:700 13.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-caption{font:500 12px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-note{font:500 11.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-by{font:800 ${BY_SIZE}px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:88%}
.l-at{font-weight:600;font-family:Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:88%;text-decoration:underline;fill:#000}
.l-seal{font:700 10.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}.l-caution{font:500 italic 10.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#444}
.l-flag{font:700 12.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#fff}
`.replace(/\n/g, '')

// `data` is a task's data; `rankingId` picks which metric the
// class arrows and headline show. The other metrics become the small figures.
// Returns null when the entry has no class in that ranking.
// `context` and `subtitle` replace the two lines under the name, for labels
// that are not about one package on one runtime.
// The version of the same entry measured before this one on the same runtime
// in the same task: the highest lower version with a figure in `rankingId`.
export function previousVersion(entry, runtime, rankingId) {
  if (!entry.version || !entry.package) return null
  const order = (a, b) => a.localeCompare(b, 'en', { numeric: true })
  return [...(runtime.entries ?? []), ...(runtime.history ?? [])]
    .filter((e) => e !== entry && e.ecosystem === entry.ecosystem && e.package === entry.package && e.title === entry.title && e.version && order(e.version, entry.version) < 0 && e.grades?.[rankingId])
    .sort((a, b) => order(b.version, a.version))[0] ?? null
}

// For a tuned variant, the same package at the same version as installed, on
// the same runtime in the same task.
export function asInstalled(entry, runtime, rankingId) {
  if (!entry.package || entry.name === entry.package) return null
  return [...(runtime.entries ?? []), ...(runtime.history ?? [])].find((e) => e.ecosystem === entry.ecosystem && e.package === entry.package && e.name === e.package && e.version === entry.version && e.grades?.[rankingId]) ?? null
}

export function renderLabel({ entry, data, runtime, rankingId = 'cpu', standalone = false, context: contextLine, subtitle: subtitleLine, address }) {
  const grade = entry.grades[rankingId]
  if (!grade) return null
  const found = metricFor(data, entry, rankingId)
  const metric = found?.headline ? { ...found, headline: collectorFree(runtime, found.headline) } : found

  const context = contextLine ?? (rankingId === 'types' ? `Type check, ${metric.tool}` : `${data.task.title}, ${runtime.title} ${runtime.version}`)
  const subtitle = subtitleLine ?? (entry.builtin ? `Built into ${runtime.title}` : entry.version ? `Version ${entry.version}` : '')

  // The mark of what the label was measured with: the runtime, or the type
  // checker. It sits at the top right, level with the capitals of the title,
  // and the title's first line stops short of it.
  const markId = rankingId === 'types' ? (entry.types?.icon ?? (entry.ecosystem === 'cargo' ? 'rust' : 'typescript')) : runtime.id
  const top = 2 + PAD
  const mark = labelIcon(markId, WIDTH - SIDE - 30, top, 30)
  const titleLines = wrap(entry.title, (line) => (line === 0 ? (markId === 'ruby-yjit' || markId === 'go' ? 17 : 19) : 22), true)
  const subtitleLines = wrap(subtitle, 43, true)
  // A reviewed benchmark carries its mark after the name. The last line of the
  // name is given its measured width, so the mark sits right whatever face a
  // viewer draws it in; a line too long for the mark is squeezed to leave room.
  const reviewMark = contextLine || !entry.adapter?.review || entry.adapter.review === 'unreviewed' ? null : REVIEW_MARKS[entry.adapter.review === 'maintainer' ? 'maintainer' : 'human']
  const badge = reviewMark && { ...reviewMark, width: Math.min(nameWidth(titleLines.at(-1)), (titleLines.length === 1 ? 230 : 280) - 26) }
  const contextLines = wrap(context, 43, true)
  // The task's name leads the line, in bold, where the label is for a task.
  const taskName = !contextLine && rankingId !== 'types' ? data.task.title : null
  const boldTask = (line, i) => i === 0 && taskName && line.startsWith(taskName) ? `<tspan font-weight="700">${esc(taskName)}</tspan>${esc(line.slice(taskName.length))}` : esc(line)
  const titleBase = top + CAP * 25
  const subtitleBase = titleBase + (titleLines.length - 1) * 28 + 22
  const contextBase = subtitleBase + (subtitleLines.length - 1) * 17 + 19
  const headerEnd = contextBase + (contextLines.length - 1) * 17 + PAD

  const figures = Object.keys(RANKINGS)
    .filter((id) => id !== rankingId && entry.grades[id])
    .map((id) => ({
      caption: RANKINGS[id].caption,
      text: `${formatAtLeast(shownValue(metricFor(data, entry, id), entry.grades[id].value), metricFor(data, entry, id).displayUnit === '×' ? 0 : LEAST[id])} ${metricFor(data, entry, id).displayUnit}`.trim(),
      rankingId: id,
      grade: entry.grades[id],
    }))
  if (entry.metrics.importMs !== null) figures.push({ caption: 'import', text: `${formatNumber(entry.metrics.importMs)} ms` })
  // Size on disk, ungraded: installed size, or for Rust what the crate adds to the binary.
  if (entry.metrics.installBytes != null) figures.push({ caption: entry.metrics.installKind === 'binary' ? 'in binary' : 'install', text: formatBytes(entry.metrics.installBytes) })

  const notes = [entry.adapter.notes, entry.adapter.runtimeNotes?.[runtime.id]]
    .filter(Boolean)
    .flatMap((note) => wrap(note, 52))
  const flagged = entry.flags.includes('grows-with-use')
  // A caution when the benchmark code behind the figure has not been checked
  // by a person. It closes the notes.
  const caution = entry.adapter.review === 'unreviewed'
    ? (entry.adapter.author?.kind === 'human'
      ? 'Benchmark code not reviewed by a second person.'
      : `Benchmark code written by ${[entry.adapter.author?.agent, entry.adapter.author?.model && `(${entry.adapter.author.model})`].filter(Boolean).join(' ') || 'AI'}, not reviewed by a human.`)
    : null
  // A reviewed benchmark says so in the same place, with a check: blue when
  // the authors of the package verified it, grey when another person did.
  const seal = caution || !entry.adapter.review ? null : entry.adapter.review === 'maintainer' ? { text: 'Benchmark verified by the package authors.', color: '#0b57d0', mark: 'M5.65 2.32Q8.00 -0.05 10.35 2.32Q13.69 2.31 13.68 5.65Q16.05 8.00 13.68 10.35Q13.69 13.69 10.35 13.68Q8.00 16.05 5.65 13.68Q2.31 13.69 2.32 10.35Q-0.05 8.00 2.32 5.65Q2.31 2.31 5.65 2.32zM11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z' } : { text: 'Benchmark reviewed by a human.', color: '#5f6368', mark: 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7.500 3.300a1.400 1.400 0 1 0 0 2.800 1.400 1.400 0 0 0 0-2.800zM6.100 6.500h2.650v6.600H7.900v-3.100h-.550v3.100H6.500V7.900h-.250v2.300H5.200V7.400a.900.900 0 0 1 .900-.900zM8.750 6.500h.680q.650 0 .650-.650V4.600h1.100v1.250q0 1.750-1.750 1.750H8.750z' }
  const cautionLines = caution ? wrap(caution, 58) : seal ? [seal.text] : []
  // Labels of one result link to its page; a summary label links to the site.
  // The address is printed in full, so it can be followed from a picture too.
  // `address` is the page of a label that is not one result (a runtime's
  // summary); it has a short link of its own.
  const link = address ? shortLinkOf(address) : contextLine ? `${labelSite.url}/` : resultShortLink(data.task.id, runtime.id, entry)
  const linkText = labelSite.host ? link.replace(/(?<=[^/:])\/$/, '') : 'This result and how it was measured'
  // As large as fits beside the logo on one line, up to 15.5px; an address
  // too long even at 10px is broken at its slashes.
  const linkSize = Math.max(10, Math.min(15.5, FOOT_ROOM / (linkText.length * 0.42)))
  const linkLines = addressLines(linkText, Math.floor(FOOT_ROOM / (linkSize * 0.42)))

  // The sections below the header, one after another.
  const scaleTop = headerEnd + PAD
  const scaleEnd = scaleTop + SCALE_HEIGHT + PAD
  const bigBase = scaleEnd + PAD + CAP * 50
  const unitBase = bigBase + 22
  // How the figure moved since the previous measured version, if there is one.
  // A tuned variant is compared with the package as installed; anything else
  // with its previous measured version.
  // An entry with no class is compared with nothing.
  const installed = contextLine || !grade.class ? null : asInstalled(entry, runtime, rankingId)
  const previous = contextLine || !grade.class ? null : installed ?? previousVersion(entry, runtime, rankingId)
  const than = installed ? 'default settings' : `version ${previous?.version}`
  const moved = previous && previous.grades[rankingId].value > 0 ? grade.value / previous.grades[rankingId].value - 1 : null
  const change = moved === null ? null : Math.abs(moved) < 0.005 ? { text: installed ? 'Tuned: same as default settings' : `Unchanged from ${than}` } : { text: `${installed ? 'Tuned: ' : ''}${Math.round(Math.abs(moved) * 100)}% ${moved < 0 ? 'lower' : 'higher'} than ${than}`, down: moved < 0 }
  // A type-check cost is a product: the CPU time and the memory it is made
  // of are said in small text under it.
  const cost = rankingId === 'types' ? (entry.types?.compilers?.[data.typesCompiler] ?? entry.types) : null
  const parts = cost?.cpuMs != null && cost?.memoryBytes != null ? `${cost.cpuMs < 10 ? '< 10' : formatNumber(cost.cpuMs)} ms CPU × ${formatAtLeast(megabytes(cost.memoryBytes), LEAST.memory)} MB${cost.community ? ' *' : ''}` : null
  const partsBase = unitBase + 16
  const changeBase = (parts ? partsBase : unitBase) + 19
  const bigEnd = (change ? changeBase : parts ? partsBase : unitBase) + PAD
  const figuresTop = bigEnd + PAD
  // A label with no secondary figures has no row for them.
  const figuresEnd = figures.length ? figuresTop + FIGURES_HEIGHT + PAD : bigEnd
  const notesBase = figuresEnd + PAD + CAP * 11.5
  const cautionBase = notes.length ? notesBase + notes.length * NOTE_LINE + 2 : figuresEnd + PAD + CAP * 10.5
  const notesEnd = !notes.length && !cautionLines.length ? figuresEnd
    : (cautionLines.length ? cautionBase + (cautionLines.length - 1) * CAUTION_LINE : notesBase + (notes.length - 1) * NOTE_LINE) + PAD
  const byBase = notesEnd + PAD + CAP * BY_SIZE
  const footEnd = byBase + linkLines.length * LINK_LINE + PAD
  const height = footEnd + (flagged ? 26 : 0)
  // The unit sits beside the big figure, and the line under it says what was
  // measured without repeating it ("µs of CPU per request" becomes "µs" and
  // "CPU per request"). A multiple of the best result has no unit to show.
  const unitLed = rankingId !== 'types' && metric.displayUnit && metric.displayUnit !== '×' && metric.headline.startsWith(`${metric.displayUnit} `)
  const bigUnit = rankingId === 'types' ? !entry.typeCaption && metric.displayUnit : unitLed
  const rest = unitLed ? metric.headline.slice(metric.displayUnit.length + 1) : metric.headline
  const bigCaption = !unitLed ? rest : rest.startsWith('of ') ? rest.slice(3) : rankingId === 'memory' ? `memory ${rest}` : rest
  const rule = (y) => `<line x1="0" y1="${y.toFixed(1)}" x2="${WIDTH}" y2="${y.toFixed(1)}" stroke="#000" stroke-width="1.5"/>`
  const summary = `${entry.title}: ${grade.class ? `class ${grade.class}` : grade.reference ? `reference, not graded (${grade.ratio}× the best graded entry)` : 'no class'} for ${RANKINGS[rankingId].title}, ${formatNumber(shownValue(metric, grade.value))} ${metric.headline}${parts ? ` (${parts})` : ''}. ${context}.${change ? ` ${change.text}${previous.grades[rankingId].class !== grade.class ? `, which was class ${previous.grades[rankingId].class}` : ''}.` : ''}`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${esc(summary)}"${standalone ? ` width="${WIDTH}" height="${height}"` : ''}>
<style>${standalone ? FONT_IMPORT : ''}${STYLE}</style>
<rect x="1" y="1" width="${WIDTH - 2}" height="${height - 2}" rx="7" fill="#fff"/>
${titleLines.map((line, i) => `<text x="${SIDE}" y="${(titleBase + i * 28).toFixed(1)}" class="l-name"${badge && i === titleLines.length - 1 ? ` textLength="${badge.width.toFixed(1)}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(line)}</text>`).join('')}
${badge ? `<g transform="translate(${(SIDE + badge.width + 6).toFixed(1)} ${(titleBase + (titleLines.length - 1) * 28 - 17.5).toFixed(1)}) scale(1.19)"><path d="${badge.shape}" fill="${badge.color}"/><path d="${badge.tick}" fill="#fff"/>${badge.arm ? `<path class="wave-arm" d="${badge.arm}" fill="#fff"/>` : ''}</g>` : ''}
${mark}
${subtitleLines.map((line, i) => `<text x="${SIDE}" y="${(subtitleBase + i * 17).toFixed(1)}" class="l-meta">${esc(line)}</text>`).join('')}
${contextLines.map((line, i) => `<text x="${SIDE}" y="${(contextBase + i * 17).toFixed(1)}" class="l-meta">${boldTask(line, i)}</text>`).join('')}
${rule(headerEnd)}
${scale(rankingId, grade.class, scaleTop, previous?.grades[rankingId].class, installed ? ['DEFAULT', 'SETTINGS'] : undefined, !contextLine && (entry.adapter?.tags ?? []).includes('non-default-options'), grade.reference ? grade.ratio : null)}
${rule(scaleEnd)}
<text x="${WIDTH / 2}" y="${bigBase.toFixed(1)}" class="l-big" text-anchor="middle">${esc(formatAtLeast(shownValue(metric, grade.value), metric.displayUnit === '×' ? 0 : LEAST[rankingId]))}${bigUnit ? BIG_UNIT(esc(metric.displayUnit)) : ''}</text>
<text x="${WIDTH / 2}" y="${unitBase.toFixed(1)}" class="l-unit" text-anchor="middle">${esc(rankingId === 'types' ? (entry.typeCaption ?? (entry.ecosystem === 'cargo' ? 'cargo check cost' : 'type-check cost')) : bigCaption)}</text>
${parts ? `<text x="${WIDTH / 2}" y="${partsBase.toFixed(1)}" class="l-parts" text-anchor="middle">${esc(parts)}</text>` : ''}
${change ? (() => {
    // Lower is better for every figure, so a fall is drawn in the scale's best colour and a rise in its worst.
    const width = change.text.length * 6.1, x = WIDTH / 2 - width / 2 + (change.down === undefined ? 0 : 8), y = changeBase - 9
    const arrow = change.down === undefined ? '' : `<path d="${change.down ? `M${x - 15} ${y}h10l-5 8z` : `M${x - 15} ${y + 8}h10l-5-8z`}" fill="${change.down ? '#00843f' : '#d2191f'}"/>`
    return `${arrow}<text x="${x}" y="${changeBase.toFixed(1)}" class="l-change">${esc(change.text)}</text>`
  })() : ''}
${rule(bigEnd)}
${figureRow(figures.slice(0, 4), figuresTop)}
${notes.length || cautionLines.length ? rule(figuresEnd) : ''}
${notes.map((line, i) => `<text x="${SIDE}" y="${(notesBase + i * NOTE_LINE).toFixed(1)}" class="l-note">${esc(line)}</text>`).join('')}
${seal ? `<path d="${seal.mark}" fill="${seal.color}" fill-rule="evenodd" transform="translate(${SIDE} ${(cautionBase - 9.5).toFixed(1)}) scale(0.72)"/><text x="${SIDE + 15}" y="${cautionBase.toFixed(1)}" class="l-seal" fill="${seal.color}">${esc(seal.text)}</text>` : cautionLines.map((line, i) => `<text x="${SIDE}" y="${(cautionBase + i * CAUTION_LINE).toFixed(1)}" class="l-caution">${esc(line)}</text>`).join('')}
${rule(notesEnd)}
${siteMark(SIDE, (notesEnd + PAD).toFixed(1), MARK_SCALE.toFixed(3))}
<text x="${FOOT_TEXT}" y="${byBase.toFixed(1)}" class="l-by">${esc(labelSite.name)}</text>
<a href="${esc(link)}">${linkLines.map((line, i) => `<text x="${FOOT_TEXT}" y="${(byBase + (i + 1) * LINK_LINE).toFixed(1)}" class="l-at" font-size="${linkSize.toFixed(2)}">${esc(line)}</text>`).join('')}</a>
${flagged ? `<path d="M1 ${footEnd.toFixed(1)}h${WIDTH - 2}v18a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7z" fill="#000"/><text x="${SIDE}" y="${(footEnd + 17).toFixed(1)}" class="l-flag">Memory grows with use</text>` : ''}
<rect x="1" y="1" width="${WIDTH - 2}" height="${height - 2}" rx="7" fill="none" stroke="#000" stroke-width="2"/>
</svg>`
}
