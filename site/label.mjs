// The efficiency label as an SVG string. Used inline in pages and written out
// as standalone files. The layout borrows the structure of an appliance energy
// label (class arrows, pointer, headline figure, secondary figures) without
// reproducing any official label's marks.

import { labelIcon } from './icons.mjs'

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

export const classColor = (rankingId, letter) => RANKINGS[rankingId].colors[CLASSES.indexOf(letter)]

// Black or white, whichever reads better on `hex`.
export function inkOn(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3 ? '#000' : '#fff'
}

const WIDTH = 320
const ROW = 30
const GAP = 4
const SCALE_TOP = 104
const FIGURES_END = 502
const NOTE_LINE = 15

const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export const formatNumber = (value) => {
  if (value === null || value === undefined) return 'n/a'
  if (value >= 100) return Math.round(value).toLocaleString('en-US')
  if (value >= 10) return value.toFixed(1)
  return value.toFixed(value < 1 ? 2 : 1)
}

function wrap(text, width, breakWords = false) {
  const lines = ['']
  const words = text.split(/\s+/).flatMap(word => breakWords ? word.match(new RegExp(`.{1,${width}}`, 'gu')) ?? [] : [word])
  for (const word of words) {
    const last = lines.at(-1)
    if (last && last.length + word.length + 1 > width) lines.push(word)
    else lines[lines.length - 1] = last ? `${last} ${word}` : word
  }
  return lines
}

function scale(rankingId, pointerClass) {
  const rows = CLASSES.map((letter, i) => {
    const y = SCALE_TOP + i * (ROW + GAP)
    const length = 74 + i * 21
    const color = classColor(rankingId, letter)
    const points = `16,${y} ${16 + length},${y} ${16 + length + 13},${y + ROW / 2} ${16 + length},${y + ROW} 16,${y + ROW}`
    return `<polygon points="${points}" fill="${color}"/><text x="26" y="${y + 21}" class="l-letter" fill="${inkOn(color)}">${letter}</text>`
  })
  const y = SCALE_TOP + CLASSES.indexOf(pointerClass) * (ROW + GAP) - 3
  const h = ROW + 6
  rows.push(
    `<polygon points="${WIDTH - 16},${y} ${WIDTH - 70},${y} ${WIDTH - 88},${y + h / 2} ${WIDTH - 70},${y + h} ${WIDTH - 16},${y + h}" fill="#000"/>`,
    `<text x="${WIDTH - 44}" y="${y + 27}" class="l-pointer" text-anchor="middle">${pointerClass}</text>`,
  )
  return rows.join('')
}

// The site's mark, small, at the end of the figures row: five class arrows in
// the CPU colours.
const MARK_COLORS = [0, 1, 3, 5, 6].map((i) => RANKINGS.cpu.colors[i])
function siteMark(x, y, width = 22, height = 20) {
  const row = height / 5
  return MARK_COLORS.map((color, i) => {
    const length = width * (0.45 + 0.1 * i)
    return `<path d="M${x} ${(y + i * row).toFixed(2)}h${length.toFixed(2)}l${(row * 0.4).toFixed(2)} ${(row * 0.4).toFixed(2)}-${(row * 0.4).toFixed(2)} ${(row * 0.4).toFixed(2)}H${x}z" fill="${color}"/>`
  }).join('')
}

// A label opened as a file of its own has no page around it to load the
// typeface, so it asks for it itself.
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&amp;display=swap');"

// One of up to three secondary figures along the bottom of the label.
function figure(index, { caption, text, rankingId, grade }) {
  const x = 16 + index * 98
  let chip = ''
  if (grade) {
    const color = classColor(rankingId, grade.class)
    chip = `<rect x="${x}" y="452" width="20" height="20" fill="${color}"/><text x="${x + 10}" y="467.5" class="l-chip" text-anchor="middle" fill="${inkOn(color)}">${grade.class}</text>`
  }
  return `${chip}<text x="${x + (grade ? 26 : 0)}" y="468" class="l-figure">${esc(text)}</text><text x="${x}" y="489" class="l-caption">${esc(caption)}</text>`
}

const STYLE = `
.l-name{font:800 25px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:80%}
.l-meta{font:500 13px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-letter{font:800 19px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-pointer{font:800 26px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#fff}
.l-big{font:800 50px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;font-stretch:80%}
.l-unit{font:500 14px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-chip{font:800 14px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-figure{font:700 13.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-caption{font:500 12px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-note{font:500 11.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif}
.l-flag{font:700 12.5px Archivo,'Archivo Narrow','Helvetica Neue',Helvetica,Arial,'Liberation Sans',sans-serif;fill:#fff}
`.replace(/\n/g, '')

// `data` is a task's normalized data; `rankingId` picks which metric the
// class arrows and headline show. The other metrics become the small figures.
// Returns null when the entry has no class in that ranking.
// `context` and `subtitle` replace the two lines under the name, for labels
// that are not about one package on one runtime.
export function renderLabel({ entry, data, runtime, rankingId = 'cpu', standalone = false, context: contextLine, subtitle: subtitleLine }) {
  const grade = entry.grades[rankingId]
  if (!grade) return null
  const metric = metricFor(data, entry, rankingId)

  const context = contextLine ?? (rankingId === 'types' ? `Type check, ${metric.tool}` : `${data.task.title}, ${runtime.title} ${runtime.version}`)
  const subtitle = subtitleLine ?? (entry.builtin ? `Built into ${runtime.title}` : entry.version ? `Version ${entry.version}` : '')

  const titleLines = wrap(entry.title, 22, true)
  const subtitleLines = wrap(subtitle, 43, true)
  const contextLines = wrap(context, 43, true)
  const titleExtra = (titleLines.length - 1) * 28
  const subtitleExtra = (subtitleLines.length - 1) * 17
  const headerExtra = titleExtra + subtitleExtra + (contextLines.length - 1) * 17

  // The mark of what the label was measured with: the runtime, or the type checker.
  const mark = labelIcon(rankingId === 'types' ? (entry.types?.icon ?? (entry.ecosystem === 'cargo' ? 'rust' : 'typescript')) : runtime.id, WIDTH - 46, 14, 30)

  const figures = Object.keys(RANKINGS)
    .filter((id) => id !== rankingId && entry.grades[id])
    .map((id) => ({
      caption: RANKINGS[id].caption,
      text: `${formatNumber(entry.grades[id].value)} ${metricFor(data, entry, id).unit}`.trim(),
      rankingId: id,
      grade: entry.grades[id],
    }))
  if (entry.metrics.importMs !== null) figures.push({ caption: 'import', text: `${formatNumber(entry.metrics.importMs)} ms` })

  const notes = [entry.adapter.notes, entry.adapter.runtimeNotes?.[runtime.id]]
    .filter(Boolean)
    .flatMap((note) => wrap(note, 52))
  const flagged = entry.flags.includes('grows-with-use')
  const notesEnd = FIGURES_END + (notes.length ? 14 + notes.length * NOTE_LINE : 0)
  const height = notesEnd + (flagged ? 26 : 0) + headerExtra
  const scaleEnd = SCALE_TOP + 7 * (ROW + GAP) + 6
  const rule = (y) => `<line x1="0" y1="${y}" x2="${WIDTH}" y2="${y}" stroke="#000" stroke-width="1.5"/>`
  const summary = `${entry.title}: class ${grade.class} for ${RANKINGS[rankingId].title}, ${formatNumber(grade.value)} ${metric.headline}. ${context}.`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-label="${esc(summary)}"${standalone ? ` width="${WIDTH}" height="${height}"` : ''}>
<style>${standalone ? FONT_IMPORT : ''}${STYLE}</style>
<rect x="1" y="1" width="${WIDTH - 2}" height="${height - 2}" rx="7" fill="#fff"/>
${titleLines.map((line, i) => `<text x="16" y="${38 + i * 28}" class="l-name">${esc(line)}</text>`).join('')}
${mark}
${subtitleLines.map((line, i) => `<text x="16" y="${60 + titleExtra + i * 17}" class="l-meta">${esc(line)}</text>`).join('')}
${contextLines.map((line, i) => `<text x="16" y="${79 + titleExtra + subtitleExtra + i * 17}" class="l-meta">${esc(line)}</text>`).join('')}
<g transform="translate(0 ${headerExtra})">
${rule(92)}
${scale(rankingId, grade.class)}
${rule(scaleEnd)}
<text x="${WIDTH / 2}" y="398" class="l-big" text-anchor="middle">${formatNumber(grade.value)}</text>
${rankingId === 'types' ? `<text x="${WIDTH / 2}" y="420" class="l-unit" text-anchor="middle">${esc(entry.typeCaption ?? (entry.ecosystem === 'cargo' ? 'cargo check cost' : 'type-check cost'))}</text>` : `<text x="${WIDTH / 2}" y="420" class="l-unit" text-anchor="middle">${esc(metric.headline)}</text>`}
${rule(436)}
${figures.slice(0, 3).map((f, i) => figure(i, f)).join('')}
${siteMark(WIDTH - 16 - 22, 461)}
${notes.length ? rule(FIGURES_END) + notes.map((line, i) => `<text x="16" y="${FIGURES_END + 20 + i * NOTE_LINE}" class="l-note">${esc(line)}</text>`).join('') : ''}
${flagged ? `<path d="M1 ${notesEnd}h${WIDTH - 2}v18a7 7 0 0 1-7 7H8a7 7 0 0 1-7-7z" fill="#000"/><text x="16" y="${notesEnd + 17}" class="l-flag">Memory grows with use</text>` : ''}
</g>
<rect x="1" y="1" width="${WIDTH - 2}" height="${height - 2}" rx="7" fill="none" stroke="#000" stroke-width="2"/>
</svg>`
}
