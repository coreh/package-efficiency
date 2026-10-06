import { compareCells, sortColumnKey, matchingSortColumn } from './sort.mjs'

// Progressive enhancement only: every page works without this file.

document.documentElement.classList.add('js')

// Search across packages, tasks and categories. Typing part of a name, its
// initials ("jas" for JSON API server) or a few of its letters in order all
// find it; the best match is listed first and the matched letters are marked.
const input = document.getElementById('q')
const results = document.getElementById('q-results')
const keyHint = document.querySelector('.search-key')
const RESULT_LIMIT = 12
let entries = null
let active = -1

const isWordStart = (text, i) => i === 0 || /[^a-z0-9]/i.test(text[i - 1]) || (/[A-Z]/.test(text[i]) && /[a-z]/.test(text[i - 1]))

// How well `word` matches `text`, and which letters matched. null: no match.
export function matchWord(word, text) {
  const lower = text.toLowerCase()
  const at = lower.indexOf(word)
  const run = (start) => Array.from({ length: word.length }, (_, k) => start + k)
  if (at === 0) return { score: lower.length === word.length ? 1000 : 900 - (lower.length - word.length), indices: run(0) }
  // The start of any word in the name beats the middle of one.
  for (let from = at; from !== -1; from = lower.indexOf(word, from + 1)) {
    if (isWordStart(text, from)) return { score: 800 - from, indices: run(from) }
  }
  if (at > 0) return { score: 700 - at, indices: run(at) }
  // Initials: each letter starts a word, in order.
  const starts = [...lower].map((_, i) => i).filter((i) => isWordStart(text, i) && /[a-z0-9]/.test(lower[i]))
  if (word.length > 1) {
    for (let first = 0; first + word.length <= starts.length; first++) {
      const picked = starts.slice(first, first + word.length)
      if (picked.every((index, k) => lower[index] === word[k])) return { score: 650 - first, indices: picked }
    }
  }
  // Fuzzy: the letters in order, with gaps. Fewer and shorter gaps score
  // higher, and so do letters that start a word.
  if (word.length < 2) return null
  const indices = []
  let from = 0
  for (const letter of word) {
    const found = lower.indexOf(letter, from)
    if (found === -1) return null
    indices.push(found)
    from = found + 1
  }
  const span = indices.at(-1) - indices[0] + 1
  if (span > word.length * 3) return null
  const bonus = indices.filter((index) => isWordStart(text, index)).length * 12
  return { score: 400 - (span - word.length) * 8 - indices[0] + bonus, indices }
}

function rank(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const found = []
  entries.forEach((entry, order) => {
    let score = 0
    const indices = new Set()
    for (const word of words) {
      const inTitle = matchWord(word, entry.t)
      // The kind ("npm", "Task") narrows a search but never outranks a name.
      const inKind = inTitle ? null : matchWord(word, entry.k)
      if (!inTitle && !(inKind && inKind.score >= 700)) return
      score += inTitle ? inTitle.score : 100
      for (const index of inTitle?.indices ?? []) indices.add(index)
    }
    found.push({ entry, score, indices, order })
  })
  return found.sort((a, b) => b.score - a.score || a.entry.t.length - b.entry.t.length || a.order - b.order)
}

function marked(text, indices) {
  const nodes = []
  let i = 0
  while (i < text.length) {
    const hit = indices.has(i)
    let end = i
    while (end < text.length && indices.has(end) === hit) end++
    const piece = text.slice(i, end)
    if (hit) {
      const mark = document.createElement('mark')
      mark.textContent = piece
      nodes.push(mark)
    } else nodes.push(piece)
    i = end
  }
  return nodes
}

function setActive(index) {
  const options = [...results.querySelectorAll('[role="option"]')]
  active = options.length ? (index + options.length) % options.length : -1
  options.forEach((option, i) => option.setAttribute('aria-selected', i === active))
  if (active >= 0) {
    input.setAttribute('aria-activedescendant', options[active].id)
    options[active].scrollIntoView({ block: 'nearest' })
  } else input.removeAttribute('aria-activedescendant')
}

function closeSearch() {
  results.hidden = true
  input.setAttribute('aria-expanded', 'false')
  input.removeAttribute('aria-activedescendant')
}

async function search() {
  entries ??= await fetch('/search.json').then((r) => r.json())
  const query = input.value.trim()
  results.replaceChildren()
  if (!query) return closeSearch()
  const found = rank(query)
  found.slice(0, RESULT_LIMIT).forEach(({ entry, indices }, i) => {
    const item = document.createElement('li')
    const link = document.createElement('a')
    const kind = document.createElement('small')
    item.setAttribute('role', 'presentation')
    link.id = `q-result-${i}`
    link.setAttribute('role', 'option')
    link.href = entry.u
    const name = document.createElement('span')
    name.append(...marked(entry.t, indices))
    link.append(name)
    kind.textContent = entry.k
    link.append(kind)
    link.addEventListener('pointermove', () => i !== active && setActive(i))
    item.append(link)
    results.append(item)
  })
  const note = document.createElement('li')
  note.className = 'search-note'
  note.setAttribute('role', 'presentation')
  if (found.length === 0) note.textContent = 'Nothing matches. Try a package, task or category name, or its initials.'
  else if (found.length > RESULT_LIMIT) note.textContent = `${found.length - RESULT_LIMIT} more. Keep typing to narrow them down.`
  else note.textContent = '↑ ↓ to move, Enter to open, Esc to close'
  results.append(note)
  results.hidden = false
  input.setAttribute('aria-expanded', 'true')
  setActive(found.length ? 0 : -1)
}

if (input) {
  const apple = /Mac|iPhone|iPad/.test(navigator.platform)
  keyHint.textContent = apple ? '⌘K' : 'Ctrl K'
  keyHint.hidden = false
  input.addEventListener('input', search)
  input.addEventListener('focus', search)
  input.addEventListener('keydown', (event) => {
    const open = !results.hidden
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return search()
      setActive(active + (event.key === 'ArrowDown' ? 1 : -1))
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      setActive(-1)
    } else if (event.key === 'Enter') {
      const option = results.querySelectorAll('[role="option"]')[active]
      if (option) {
        event.preventDefault()
        // Keep the modifier, so Cmd or Ctrl with Enter opens a new tab.
        if (event.metaKey || event.ctrlKey) window.open(option.href, '_blank')
        else location.href = option.href
      }
    } else if (event.key === 'Escape') {
      if (open) closeSearch()
      else if (input.value) input.value = ''
      else input.blur()
      event.preventDefault()
    } else if (event.key === 'Tab') closeSearch()
  })
  document.addEventListener('keydown', (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
    const shortcut = (event.key.toLowerCase() === 'k' && (apple ? event.metaKey : event.ctrlKey) && !event.altKey) || (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey)
    if (!shortcut) return
    event.preventDefault()
    input.focus()
    input.select()
  })
  // A click or a tap anywhere else, or focus moving on, dismisses the list.
  document.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.search')) closeSearch()
  })
  input.closest('.search').addEventListener('focusout', (event) => {
    if (!event.relatedTarget?.closest?.('.search')) setTimeout(() => document.activeElement?.closest?.('.search') || closeSearch(), 0)
  })
}

// Keep the runtime and ranking choice in the address and across pages, so a
// view can be linked to and stays put while browsing.
const switches = [...document.querySelectorAll('.switch input')]
const chosen = new URLSearchParams(location.hash.slice(1))
for (const name of new Set(switches.map((s) => s.name))) {
  const wanted = chosen.get(name) ?? sessionStorage.getItem(name)
  const target = switches.find((s) => s.name === name && s.value === wanted)
  if (target) target.checked = true
}
// Keep runtime choices short while preserving the complete no-JavaScript view.
const languageTitles = { all: 'All', javascript: 'JavaScript', python: 'Python', ruby: 'Ruby', go: 'Go', rust: 'Rust' }
for (const runtimeSwitch of document.querySelectorAll('.switch:has(input[name="runtime"])')) {
  const radios = [...runtimeSwitch.querySelectorAll('input')]
  const languages = [...new Set(radios.map((radio) => radio.dataset.language))].sort((a,b) => a === 'all' ? -1 : b === 'all' ? 1 : 0)
  if (languages.length < 2) {
    runtimeSwitch.hidden = radios.length === 1
    continue
  }
  const field = document.createElement('fieldset')
  field.className = 'switch language-switch'
  const legend = document.createElement('legend')
  legend.textContent = 'Language'
  field.append(legend)
  const languageRadios = languages.map((language) => {
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = 'language'
    radio.id = `language-${language}`
    radio.value = language
    const label = document.createElement('label')
    label.htmlFor = radio.id
    const icon = runtimeSwitch.querySelector(`template[data-language-icon="${language}"]`)
    if (icon) label.append(icon.content.cloneNode(true))
    label.append(languageTitles[language] ?? language)
    field.append(radio, label)
    return radio
  })
  const syncLanguage = () => {
    const language = radios.find((radio) => radio.checked).dataset.language
    runtimeSwitch.hidden = radios.filter(radio => radio.dataset.language === language).length === 1
    for (const radio of languageRadios) radio.checked = radio.value === language
    for (const radio of radios) {
      radio.hidden = radio.dataset.language !== language
      radio.nextElementSibling.hidden = radio.hidden
    }
  }
  for (const radio of languageRadios) radio.addEventListener('change', () => {
    const target = radios.find((runtime) => runtime.dataset.language === radio.value)
    target.checked = true
    target.dispatchEvent(new Event('change', { bubbles: true }))
  })
  runtimeSwitch.addEventListener('change', syncLanguage)
  runtimeSwitch.before(field)
  syncLanguage()
}

for (const control of switches) {
  control.addEventListener('change', () => {
    sessionStorage.setItem(control.name, control.value)
    const state = new URLSearchParams()
    for (const s of switches) if (s.checked) state.set(s.name, s.value)
    history.replaceState(null, '', `#${state}`)
  })
}

// Every column of a sortable table can be sorted, names included: headings
// that are plain text in the markup get a button here.
for (const heading of document.querySelectorAll('table.sortable thead tr:last-child th')) {
  if (heading.querySelector('[data-sort]')) continue
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.sort = ''
  button.append(...heading.childNodes)
  heading.append(button)
}

// Share sorting across a tab group by column meaning, not its position.
// Best first or worst first: reverses every row of labels in the same group.
function applyOrder(control) {
  if (!control.checked) return
  for (const list of control.closest('.explorer, .ranked')?.querySelectorAll('.shelf') ?? []) {
    if ((list.dataset.order ?? 'best') === control.value) continue
    list.append(...[...list.children].reverse())
    list.dataset.order = control.value
    list.scrollLeft = 0
  }
}
for (const control of document.querySelectorAll('input[name^="order"]')) {
  control.addEventListener('change', () => applyOrder(control))
  applyOrder(control)
}

// The Settings switch chooses between a package as installed and its tuned
// variant. Cells that have both sort by whichever is showing.
function applySettings() {
  const tuned = document.querySelector('input[name="settings"][value="tuned"]')?.checked ?? true
  for (const cell of document.querySelectorAll('td[data-tuned-v]')) {
    cell.dataset.installedGrade ??= cell.dataset.grade
    cell.dataset.installedV ??= cell.dataset.v
    cell.dataset.installedValue ??= cell.dataset.value
    cell.dataset.grade = tuned ? cell.dataset.tunedGrade : cell.dataset.installedGrade
    cell.dataset.v = tuned ? cell.dataset.tunedV : cell.dataset.installedV
    cell.dataset.value = tuned ? cell.dataset.tunedValue : cell.dataset.installedValue
  }
}
for (const control of document.querySelectorAll('input[name="settings"]')) control.addEventListener('change', applySettings)
applySettings()

// All panels are rendered up front, so switching tabs reveals the same order.
// A graded heading steps through several orders with one control: by class,
// then by figure, and for type checks by cost, CPU time and memory too. Each
// press goes ascending, then descending, then on to the next field.
const FIELD_LABELS = { grade: 'label', value: 'value', score: 'cost', time: 'CPU', memory: 'memory' }
const columnKey = (heading) => sortColumnKey(heading.dataset.col ?? heading.querySelector('[data-sort]')?.textContent ?? heading.textContent)
function sortTable(table, key, descending, field) {
  const headings = [...table.querySelectorAll('thead tr:last-child th')]
  const column = matchingSortColumn(headings.map(columnKey), key)
  if (column < 0) return // This tab has no equivalent column; other tabs retain it.
  for (const th of headings) {
    th.removeAttribute('aria-sort')
    delete th.dataset.field
    const slot = th.querySelector('.sort-field')
    if (slot) slot.textContent = ''
  }
  const heading = headings[column]
  heading.setAttribute('aria-sort', descending ? 'descending' : 'ascending')
  if (field) {
    heading.dataset.field = field
    const slot = heading.querySelector('.sort-field')
    if (slot) slot.textContent = FIELD_LABELS[field] ?? field
  }
  const rows = [...table.tBodies[0].rows]
  const numeric = rows.some(row => row.children[column].dataset.v !== undefined)
  rows.sort((a,b) => compareCells(a.children[column], b.children[column], {numeric,descending,field}))
  table.tBodies[0].append(...rows)
  table.dispatchEvent(new Event('sorted'))
}
for (const button of document.querySelectorAll('table.sortable [data-sort]')) {
  button.addEventListener('click', () => {
    const heading = button.closest('th')
    const table = heading.closest('table')
    const key = columnKey(heading)
    const fields = (heading.dataset.fields ?? '').split(',').filter(Boolean)
    const sorted = heading.getAttribute('aria-sort')
    let field
    let descending = false
    if (fields.length === 0) descending = sorted === 'ascending'
    else if (!sorted) field = fields[0]
    else if (sorted === 'ascending') [field, descending] = [heading.dataset.field, true]
    else field = fields[(fields.indexOf(heading.dataset.field) + 1) % fields.length]
    const group = table.closest('.explorer, .pick')
    const tables = group ? group.querySelectorAll('table.sortable') : [table]
    for (const target of tables) sortTable(target, key, descending, field)
  })
}

// Long tables are shown a page at a time. Every row is still in the page, so
// sorting covers all of them and a link to a row opens the page it is on.
const PAGE_SIZE = 30
for (const table of document.querySelectorAll('table.sortable')) {
  const body = table.tBodies[0]
  if (!body || body.rows.length <= PAGE_SIZE) continue
  const pager = document.createElement('nav')
  pager.className = 'pager'
  pager.setAttribute('aria-label', 'Table pages')
  const status = document.createElement('span')
  status.setAttribute('aria-live', 'polite')
  const button = (text, action) => {
    const control = document.createElement('button')
    control.type = 'button'
    control.textContent = text
    control.addEventListener('click', action)
    return control
  }
  let page = 0
  let all = false
  const pages = () => Math.ceil(body.rows.length / PAGE_SIZE)
  const show = () => {
    const total = body.rows.length
    const start = all ? 0 : page * PAGE_SIZE
    const end = all ? total : Math.min(total, start + PAGE_SIZE)
    ;[...body.rows].forEach((row, i) => (row.hidden = i < start || i >= end))
    status.textContent = `${(start + 1).toLocaleString('en-US')}–${end.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`
    previous.disabled = all || page === 0
    next.disabled = all || page >= pages() - 1
    everything.textContent = all ? `Show ${PAGE_SIZE} at a time` : 'Show all'
  }
  const previous = button('Previous', () => (page--, show()))
  const next = button('Next', () => (page++, show()))
  const everything = button('', () => ((all = !all), (page = 0), show()))
  pager.append(previous, status, next, everything)
  ;(table.closest('.scroll') ?? table).after(pager)
  table.addEventListener('sorted', () => ((page = 0), show()))
  const reveal = () => {
    const target = location.hash.length > 1 && !location.hash.includes('=') && document.getElementById(decodeURIComponent(location.hash.slice(1)))
    if (!target || !body.contains(target)) return
    page = Math.floor([...body.rows].indexOf(target.closest('tr')) / PAGE_SIZE)
    show()
    target.scrollIntoView({ block: 'center' })
  }
  addEventListener('hashchange', reveal)
  show()
  reveal()
}

// --- Menus --------------------------------------------------------------------

// A short message that confirms a copy or reports why it failed.
let toastTimer
function toast(text) {
  let box = document.querySelector('.toast')
  if (!box) {
    box = document.createElement('div')
    box.className = 'toast'
    box.setAttribute('role', 'status')
    document.body.append(box)
  }
  box.textContent = text
  box.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (box.hidden = true), 2200)
}

// Menus are <details class="menu">: they open without this script. Here they
// close on a click elsewhere, on Escape, and once something is chosen.
const closeMenus = (except) => {
  for (const menu of document.querySelectorAll('details.menu[open]')) if (menu !== except) menu.open = false
}
document.addEventListener('pointerdown', (event) => closeMenus(event.target.closest('details.menu')))
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  const open = document.querySelector('details.menu[open]')
  if (!open) return
  open.open = false
  open.querySelector('summary').focus()
})
document.addEventListener('click', (event) => {
  if (event.target.closest('details.menu li')) closeMenus()
})

// Copying something that still has to be fetched or drawn: the clipboard
// takes a promise, which keeps the copy tied to the click in every browser.
async function copy(type, content, done) {
  try {
    const blob = Promise.resolve(content).then((value) => (value instanceof Blob ? value : new Blob([value], { type })))
    await navigator.clipboard.write([new ClipboardItem({ [type]: blob })])
    toast(done)
  } catch {
    toast('Copying was blocked by the browser.')
  }
}

function save(blob, name) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
}

// The page as Markdown, ready to paste into a language model.
for (const menu of document.querySelectorAll('.page-menu')) {
  const markdown = new URL(menu.dataset.markdown, location.href).href
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'copy-page'
  button.append(menu.querySelector('summary svg').cloneNode(true), 'Copy page')
  button.title = 'Copy this page as Markdown, ready to paste into a language model'
  button.addEventListener('click', () => copy('text/plain', fetch(markdown).then((r) => r.text()), 'Page copied as Markdown'))
  menu.prepend(button)
  menu.classList.add('split')
  menu.querySelector('summary').setAttribute('aria-label', 'More ways to copy and download')
  const claude = menu.querySelector('[data-open-claude]')
  claude.href = `https://claude.ai/new?q=${encodeURIComponent(`Read ${markdown} and help me understand these package efficiency results.`)}`
  claude.target = '_blank'
}

// --- Label menu ---------------------------------------------------------------

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap'
// An image drawn from SVG cannot load a typeface from the network, so a PNG
// gets the typeface embedded. Fetched once, on the first PNG.
let embeddedFont
function fontFace() {
  embeddedFont ??= (async () => {
    try {
      const css = await fetch(FONT_CSS).then((r) => r.text())
      const latin = css.split('/* latin */')[1] ?? css
      const url = /url\((https:[^)]+)\)/.exec(latin)[1]
      const bytes = new Uint8Array(await fetch(url).then((r) => r.arrayBuffer()))
      let binary = ''
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return `@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${btoa(binary)}) format('woff2');font-weight:400 900;font-stretch:62% 125%}`
    } catch {
      return ''
    }
  })()
  return embeddedFont
}

// The label as a file of its own: sized, namespaced, and able to find its typeface.
function labelSvg(svg, fontCss) {
  const copy = svg.cloneNode(true)
  const [, , width, height] = copy.getAttribute('viewBox').split(' ').map(Number)
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copy.setAttribute('width', width)
  copy.setAttribute('height', height)
  copy.removeAttribute('class')
  const style = copy.querySelector('style')
  if (style) style.textContent = fontCss + style.textContent
  return { text: new XMLSerializer().serializeToString(copy), width, height }
}

async function labelPng(svg) {
  const { text, width, height } = labelSvg(svg, await fontFace())
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`
  await image.decode()
  const scale = 3
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

const labelName = (svg) => (svg.getAttribute('aria-label') ?? 'label').split('.')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

const LABEL_ACTIONS = [
  ['Copy as PNG', (svg) => copy('image/png', labelPng(svg), 'Label copied as an image')],
  ['Copy as SVG', (svg) => copy('text/plain', labelSvg(svg, `@import url('${FONT_CSS.replace(/&/g, '&amp;')}');`).text, 'Label copied as SVG code')],
  ['Save PNG', async (svg) => save(await labelPng(svg), `${labelName(svg)}.png`)],
  ['Save SVG', (svg) => save(new Blob([labelSvg(svg, `@import url('${FONT_CSS.replace(/&/g, '&amp;')}');`).text], { type: 'image/svg+xml' }), `${labelName(svg)}.svg`)],
  ['Copy link', (svg, url) => copy('text/plain', new URL(url, location.href).href, 'Link to the label copied'), true],
  ['Open SVG', (svg, url) => window.open(url, '_blank'), true],
]

// Every label gets the same menu, built when it is first opened.
for (const holder of document.querySelectorAll('[data-label]')) {
  const svg = holder.querySelector('svg[role="img"]')
  if (!svg) continue
  const menu = document.createElement('details')
  menu.className = 'menu label-menu'
  const summary = document.createElement('summary')
  summary.setAttribute('aria-label', 'Copy or save this label')
  summary.title = 'Copy or save this label'
  summary.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="1.6"/><circle cx="8" cy="8" r="1.6"/><circle cx="13" cy="8" r="1.6"/></svg>'
  menu.append(summary)
  menu.addEventListener('toggle', () => {
    if (!menu.open || menu.querySelector('ul')) return
    const list = document.createElement('ul')
    for (const [text, action, needsFile] of LABEL_ACTIONS) {
      if (needsFile && !holder.dataset.label) continue
      const item = document.createElement('li')
      const control = document.createElement('button')
      control.type = 'button'
      control.textContent = text
      control.addEventListener('click', () => action(svg, holder.dataset.label))
      item.append(control)
      list.append(item)
    }
    menu.append(list)
  })
  holder.classList.add('has-label-menu')
  svg.after(menu)
}
