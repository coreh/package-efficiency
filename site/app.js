import { compareCells, sortColumnKey, matchingSortColumn } from './sort.mjs'

// Progressive enhancement only: every page works without this file.

document.documentElement.classList.add('js')

// Every row of a table, in order. A long table keeps only the page being
// shown in the document and the rest in this list (`table.allRows`), so the
// browser lays out thirty rows, not thousands; sorting, filtering and copying
// all go through here to reach the rows that are not on show.
const rowsOf = (table) => table.allRows ?? [...table.tBodies[0].rows]

// Remember which category the reader is in, so a package that belongs to
// several opens the side menu at that one (the swap itself is inline in the
// page, to happen before anything is drawn).
const sideCategory = document.querySelector('nav.side')?.dataset.category
try {
  if (sideCategory) sessionStorage.setItem('category', sideCategory)
} catch {}

// Search across packages, tasks and categories. Typing part of a name, its
// initials ("jas" for JSON API server) or a few of its letters in order all
// find it; the best match is listed first and the matched letters are marked.
const input = document.getElementById('q')
const results = document.getElementById('q-results')
const keyHint = document.querySelector('.search-key')
const RESULT_LIMIT = 40
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

// How well every word of the query matches `text`: null unless all do.
function matchAll(words, text, kind) {
  let score = 0
  const indices = new Set()
  for (const word of words) {
    const inText = matchWord(word, text)
    // The kind ("npm", "Task") narrows a search but never outranks a name.
    const inKind = inText ? null : matchWord(word, kind)
    if (!inText && !(inKind && inKind.score >= 700)) return null
    score += inText ? inText.score : 100
    for (const index of inText?.indices ?? []) indices.add(index)
  }
  return { score, indices }
}

const band = (score) => (score >= 1000 ? 5 : score >= 800 ? 4 : score >= 700 ? 3 : score >= 600 ? 2 : score >= 350 ? 1 : 0)

function rank(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const found = []
  entries.forEach((entry, order) => {
    let best = matchAll(words, entry.t, entry.k)
    // A category is also found by its other names. One of those wins only
    // when it matches a whole band better than the title does, and then
    // ranks just behind a title that matches as well.
    for (const alias of entry.a ?? []) {
      const match = matchAll(words, alias, entry.k)
      const score = match && match.score - words.length
      if (match && (!best || (best.alias ? score > best.score : band(score / words.length) > band(best.score / words.length)))) best = { score, indices: match.indices, alias }
    }
    if (best) found.push({ entry, order, ...best })
  })
  // How well the words match comes first, in broad bands (exact, start of the
  // name, start of a word, inside a word, letters in order); within a band the
  // more used package leads, so the likelier one is nearer the top. Pages that
  // are not packages (tasks, categories, runtimes) count as most used.
  const used = (entry) => entry.r ?? 0
  return found.sort((a, b) => band(b.score / words.length) - band(a.score / words.length) || used(a.entry) - used(b.entry) || b.score - a.score || a.entry.t.length - b.entry.t.length || a.order - b.order)
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
  found.slice(0, RESULT_LIMIT).forEach(({ entry, indices, alias }, i) => {
    const item = document.createElement('li')
    const link = document.createElement('a')
    const kind = document.createElement('small')
    item.setAttribute('role', 'presentation')
    link.id = `q-result-${i}`
    link.setAttribute('role', 'option')
    link.href = entry.u
    if (entry.i) {
      // Images, not masks: the list is white in both colour schemes, and a
      // mask is drawn through a bitmap, which blurs the finer marks.
      const category = entry.i.startsWith('cat/')
      const icon = Object.assign(document.createElement('img'), { src: `/icons/${category ? '' : 's/'}${entry.i}.svg`, alt: '', className: category ? 'ico cat' : 'ico' })
      link.append(icon)
    }
    const name = document.createElement('span')
    if (alias) {
      // Found by another name: that name, an arrow, then the category's own.
      const other = document.createElement('span')
      other.className = 'alias'
      other.append(...marked(alias, indices))
      const arrow = document.createElement('span')
      arrow.className = 'alias-arrow'
      arrow.setAttribute('aria-label', 'is under')
      arrow.textContent = '→'
      name.append(other, arrow, entry.t)
    } else name.append(...marked(entry.t, indices))
    link.append(name)
    if (entry.v) {
      const mark = document.createElement('span')
      mark.className = `verified ${entry.v === 'm' ? 'maintainer' : 'human'}`
      mark.title = entry.v === 'm' ? 'Verified by the package authors' : 'Reviewed by a human'
      mark.innerHTML = entry.v === 'm' ? CHECK : ROUND_CHECK
      link.append(mark)
    }
    kind.textContent = entry.k
    link.append(kind)
    link.addEventListener('pointermove', () => i !== active && setActive(i))
    item.append(link)
    results.append(item)
  })
  const note = document.createElement('li')
  note.className = 'search-note'
  note.setAttribute('role', 'presentation')
  if (found.length === 0) note.textContent = 'No result. Try the name of a package, task or category, or its initials.'
  else if (found.length > RESULT_LIMIT) note.textContent = `${found.length - RESULT_LIMIT} more. Type more letters to see fewer results.`
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
  // Pressing on a result must not take focus from the field: Safari does not
  // focus a clicked link, so the list would be dismissed before the click.
  results.addEventListener('mousedown', (event) => event.preventDefault())
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
// A page can have one "Reference items" switch above each of its tables. They
// are kept in step, so the choice holds on every tab.
const referenceSwitches = switches.filter((s) => s.name.startsWith('reference-'))
if (referenceSwitches.some((s) => s.value === 'hidden' && s.checked)) for (const s of referenceSwitches) if (s.value === 'hidden') s.checked = true
for (const control of referenceSwitches) control.addEventListener('change', () => {
  for (const other of referenceSwitches) if (other.value === control.value) other.checked = true
})
// Keep runtime choices short while preserving the complete no-JavaScript view.
const languageTitles = { all: 'All', javascript: 'JavaScript', python: 'Python', ruby: 'Ruby', go: 'Go', rust: 'Rust' }
for (const runtimeSwitch of document.querySelectorAll('.switch:has(input[name="runtime"])')) {
  const radios = [...runtimeSwitch.querySelectorAll('input')]
  const languages = [...new Set(radios.map((radio) => radio.dataset.language))].sort((a,b) => a === 'all' ? -1 : b === 'all' ? 1 : 0)
  if (languages.length < 2) {
    runtimeSwitch.hidden = radios.length === 1
    continue
  }
  const field = document.createElement('div')
  field.className = 'switch language-switch'
  field.setAttribute('role', 'radiogroup')
  field.setAttribute('aria-label', 'Language')
  const legend = document.createElement('span')
  legend.className = 'legend'
  legend.setAttribute('aria-hidden', 'true')
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
  // Language leads the row, whatever else is in it.
  runtimeSwitch.parentElement.prepend(field)
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
  const cells = [...document.querySelectorAll('table.sortable')].flatMap((table) => rowsOf(table).flatMap((row) => (row.className === 'unmeasured' ? [] : [...row.querySelectorAll('td[data-tuned-v]')])))
  for (const cell of cells) {
    cell.dataset.installedGrade ??= cell.dataset.grade
    cell.dataset.installedV ??= cell.dataset.v
    cell.dataset.installedValue ??= cell.dataset.value
    cell.dataset.v = tuned ? cell.dataset.tunedV : cell.dataset.installedV
    // The Medals cell has only a sort number, no class or figure.
    if (cell.dataset.tunedGrade === undefined) continue
    cell.dataset.grade = tuned ? cell.dataset.tunedGrade : cell.dataset.installedGrade
    cell.dataset.value = tuned ? cell.dataset.tunedValue : cell.dataset.installedValue
  }
}
// The figures a column sorts by have just changed, so a table that is sorted
// by one of them is sorted again, the same way.
function resort() {
  for (const table of document.querySelectorAll('table.sortable')) {
    const heading = table.querySelector('thead th[aria-sort]')
    if (heading?.querySelector('td, [data-sort]') && rowsOf(table).some((row) => row.className !== 'unmeasured' && row.querySelector('td[data-tuned-v]'))) sortTable(table, columnKey(heading), heading.getAttribute('aria-sort') === 'descending', heading.dataset.field)
  }
}
for (const control of document.querySelectorAll('input[name="settings"]')) control.addEventListener('change', () => (applySettings(), resort()))
applySettings()

// All panels are rendered up front, so switching tabs reveals the same order.
// A graded heading steps through several orders with one control: by class,
// then by figure, and for type checks by cost, CPU time and memory too. Each
// press goes ascending, then descending, then on to the next field. A column
// marked data-cycle="fields" goes through its fields first, then turns round.
const FIELD_LABELS = { grade: 'label', value: 'value', score: 'cost', time: 'CPU', memory: 'memory', mean: 'mean', median: 'median', spread: 'std dev' }
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
  // Each cell is read once into a plain copy and the copies are sorted, so
  // the thousands of comparisons never touch the page.
  const copies = rowsOf(table).map((row) => {
    const cell = row.children[column]
    return { row, cell: { dataset: { ...cell.dataset }, textContent: cell.textContent } }
  })
  const numeric = copies.some(({ cell }) => cell.dataset.v !== undefined)
  copies.sort((a, b) => compareCells(a.cell, b.cell, { numeric, descending, field }))
  const rows = copies.map(({ row }) => row)
  if (table.allRows) table.allRows = rows
  else table.tBodies[0].append(...rows)
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
    // A column can ask to start from its largest values (data-first).
    if (fields.length === 0) descending = sorted ? sorted === 'ascending' : heading.dataset.first === 'descending'
    else if (!sorted) field = fields[0]
    else if (heading.dataset.cycle === 'fields') {
      // Through the fields first, in the same direction; back at the first
      // one, the direction turns.
      const next = fields.indexOf(heading.dataset.field) + 1
      field = fields[next % fields.length]
      descending = (sorted === 'descending') !== (next >= fields.length)
    }
    else if (sorted === 'ascending') [field, descending] = [heading.dataset.field, true]
    else field = fields[(fields.indexOf(heading.dataset.field) + 1) % fields.length]
    const group = table.closest('.explorer, .pick')
    const tables = group ? group.querySelectorAll('table.sortable') : [table]
    for (const target of tables) sortTable(target, key, descending, field)
  })
}

// Tables that list packages or tasks of several kinds get a row of filters,
// built from the values their rows carry (data-status, data-ecosystem, ...).
// A filter with only one value to choose from is left out.
const FILTER_TITLES = { status: 'Show', ecosystem: 'Ecosystem', group: 'Group' }
const STATUS_ORDER = ['Measured', 'Benchmark not run yet', 'No benchmark yet', 'No comparable task']
let filterCount = 0
function buildFilters(table) {
  if (table.dataset.filtered) return
  const body = table.tBodies[0]
  const chosen = {}
  const groups = []
  for (const key of table.dataset.filters.split(',')) {
    const counts = new Map()
    for (const row of rowsOf(table)) counts.set(row.dataset[key], (counts.get(row.dataset[key]) ?? 0) + 1)
    if (counts.size < 2) continue
    const values = [...counts.keys()].sort((a, b) => (key === 'status' ? STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b) : 0))
    const group = document.createElement('div')
    group.className = 'switch'
    group.setAttribute('role', 'radiogroup')
    group.setAttribute('aria-label', FILTER_TITLES[key] ?? key)
    const legend = document.createElement('span')
    legend.className = 'legend'
    legend.setAttribute('aria-hidden', 'true')
    legend.textContent = FILTER_TITLES[key] ?? key
    group.append(legend)
    const name = `filter-${++filterCount}-${key}`
    ;[null, ...values].forEach((value, i) => {
      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = name
      radio.id = `${name}-${i}`
      radio.checked = value === null
      const label = document.createElement('label')
      label.htmlFor = radio.id
      // The mark that goes with the value in the table, where it has one.
      const mark = value !== null && rowsOf(table).find((row) => row.dataset[key] === value)?.querySelector(`td .ico`)
      if (key === 'ecosystem' && mark) label.append(mark.cloneNode(true))
      label.append(value ?? 'All')
      const count = document.createElement('small')
      count.textContent = (value === null ? rowsOf(table).length : counts.get(value)).toLocaleString('en-US')
      label.append(count)
      radio.addEventListener('change', () => {
        chosen[key] = value
        for (const row of rowsOf(table)) {
          const out = Object.entries(chosen).some(([k, wanted]) => wanted !== null && row.dataset[k] !== wanted)
          if (out) row.dataset.out = '1'
          else delete row.dataset.out
          if (!table.allRows) row.hidden = out
        }
        table.dispatchEvent(new Event('filtered'))
      })
      group.append(radio, label)
    })
    groups.push(group)
  }
  if (groups.length === 0) return
  table.dataset.filtered = 'true'
  const row = document.createElement('div')
  row.className = 'switches filters'
  row.append(...groups)
  ;(table.headHolder ?? table.closest('.scroll') ?? table).before(row)
}
for (const table of document.querySelectorAll('table[data-filters]')) {
  buildFilters(table)
  // A table that gains rows later may only then have something to filter by.
  table.addEventListener('grown', () => buildFilters(table))
}

// Long tables are shown a page at a time, with the same controls above and
// below. Every row is still in the page, so sorting covers all of them and a
// link to a row opens the page it is on.
const PAGE_SIZE = 30
function paginate(table) {
  const body = table.tBodies[0]
  if (!body || rowsOf(table).length <= PAGE_SIZE || table.dataset.paged) return
  table.dataset.paged = 'true'
  // From here on the table's rows live in `allRows`; only a page of them is
  // in the document at a time.
  table.allRows = rowsOf(table)
  let page = 0
  let all = false
  // Rows a filter has taken out are not counted or shown.
  const kept = () => table.allRows.filter((row) => !row.dataset.out)
  const pages = () => Math.ceil(kept().length / PAGE_SIZE)
  const pagers = ['above', 'below'].map((place) => {
    const nav = document.createElement('nav')
    nav.className = `pager ${place}`
    nav.setAttribute('aria-label', `Table pages, ${place} the table`)
    const control = (text, action) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = text
      button.addEventListener('click', () => {
        action()
        show()
        // Paging from the bottom would otherwise leave the reader below a
        // table that just got shorter.
        if (place === 'below') bar.scrollIntoView({ block: 'nearest' })
      })
      nav.append(button)
      return button
    }
    const previous = control('Previous', () => page--)
    const status = document.createElement('span')
    status.className = 'status'
    nav.append(status)
    const next = control('Next', () => page++)
    const everything = control('', () => ((all = !all), (page = 0)))
    everything.className = 'all'
    return { nav, previous, status, next, everything }
  })
  pagers[1].status.setAttribute('aria-live', 'polite')
  const wrapper = table.closest('.scroll') ?? table
  wrapper.after(pagers[1].nav)
  // The upper pager shares a row with the switches that belong to the table
  // (its filters, or its group's runtime and settings switches) and keeps the
  // top right corner of it; the switches wrap in the space to its left.
  // (The sticky copy of the headings, if there is one, sits between the two.)
  const lead = table.headHolder ?? wrapper
  let bar = lead.previousElementSibling?.classList.contains('switches') ? lead.previousElementSibling : table.closest('.pick')?.querySelector(':scope > .switches')
  if (!bar) {
    bar = document.createElement('div')
    bar.className = 'switches'
    lead.before(bar)
  }
  if (!bar.classList.contains('has-pager')) {
    const groups = document.createElement('div')
    groups.className = 'switch-groups'
    groups.append(...bar.childNodes)
    bar.append(groups)
    bar.classList.add('has-pager')
  }
  bar.append(pagers[0].nav)

  const show = () => {
    const rows = kept()
    const total = rows.length
    const start = all ? 0 : page * PAGE_SIZE
    const end = all ? total : Math.min(total, start + PAGE_SIZE)
    body.replaceChildren(...rows.slice(start, end))
    for (const pager of pagers) {
      pager.status.textContent = total ? `${(start + 1).toLocaleString('en-US')}–${end.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}` : 'No rows'
      pager.previous.disabled = all || page === 0
      pager.next.disabled = all || page >= pages() - 1
      pager.everything.textContent = all ? `Show ${PAGE_SIZE} at a time` : 'Show all'
    }
  }

  // A table sizes its columns to the rows on show, so they would shift from
  // page to page. Each column is held at the width its widest content needs.
  // Laying out every row to find that is slow for thousands of them, so the
  // rows measured are, for each column, the few with the longest text in it:
  // those decide the width. Measured again when the space for the table
  // changes, which is also when a table in a hidden tab first appears.
  let widestRows = null
  const widest = () => {
    if (widestRows) return widestRows
    // One pass: for each column, the three rows with the longest text so far.
    const top = headings.map(() => [])
    for (const row of table.allRows) {
      for (let column = 0; column < top.length; column++) {
        const length = row.children[column]?.textContent.length ?? 0
        const held = top[column]
        if (held.length < 3 || length > held[2].length) {
          held.push({ row, length })
          held.sort((a, b) => b.length - a.length)
          held.length = Math.min(held.length, 3)
        }
      }
    }
    return (widestRows = [...new Set(top.flat().map((entry) => entry.row))])
  }
  const headings = [...table.querySelectorAll('thead tr:last-child th')]
  let measuredAt = -1
  const holdColumns = () => {
    // The outer width: the inner one changes whenever a scrollbar comes or
    // goes with the number of rows, which is not a reason to measure again.
    const space = Math.round(wrapper.getBoundingClientRect().width)
    // Several tables can share one row of switches, one per tab; only the
    // table on show keeps its pager there.
    pagers[0].nav.hidden = space === 0
    if (space === 0 || space === measuredAt) return
    measuredAt = space
    body.replaceChildren(...(table.allRows.length <= 200 ? table.allRows : widest()))
    table.style.width = table.style.minWidth = ''
    for (const th of headings) th.style.width = th.style.minWidth = ''
    const widths = headings.map((th) => th.getBoundingClientRect().width)
    const whole = table.getBoundingClientRect().width
    headings.forEach((th, i) => (th.style.width = th.style.minWidth = `${widths[i]}px`))
    table.style.width = table.style.minWidth = `${whole}px`
    show()
  }
  new ResizeObserver(holdColumns).observe(wrapper)
  document.fonts?.ready.then(() => ((measuredAt = -1), holdColumns()))

  table.addEventListener('sorted', () => ((page = 0), show()))
  table.addEventListener('filtered', () => ((page = 0), show()))
  // Rows were added: count them, and measure the columns again.
  table.addEventListener('grown', () => ((page = 0), (measuredAt = -1), (widestRows = null), holdColumns()))
  const reveal = () => {
    // The row may not be in the document, so it is looked up in the list.
    const id = location.hash.length > 1 && !location.hash.includes('=') && decodeURIComponent(location.hash.slice(1))
    const target = id && table.allRows.find((row) => row.id === id)
    if (!target) return
    all = false
    if (target.dataset.out) return
    page = Math.floor(kept().indexOf(target) / PAGE_SIZE)
    show()
    target.scrollIntoView({ block: 'center' })
  }
  addEventListener('hashchange', reveal)
  show()
  holdColumns()
  reveal()
}
for (const table of document.querySelectorAll('table.sortable')) paginate(table)

// The package table can list every known package, not only the measured ones.
// The rest come from one file, fetched once, and are added to a tab's table
// the first time that tab is shown: a tab for a language gets that language's
// registries, the "All" tab gets everything. They have no figures, so they
// follow the measured rows, most used first.
const REGISTRIES_OF = { javascript: ['npm', 'jsr'], python: ['pypi'], ruby: ['rubygems'], go: ['gomod'], rust: ['cargo'] }
const LANGUAGE_OF = { npm: 'JavaScript', jsr: 'JavaScript', pypi: 'Python', rubygems: 'Ruby', gomod: 'Go', cargo: 'Rust' }
let catalog = null
async function fillPanel(host, panel) {
  if (panel.dataset.filled) return
  panel.dataset.filled = 'true'
  catalog ??= fetch('/data/catalog.json').then((r) => r.json())
  const { registries, packages } = await catalog
  const language = host.querySelector(`input[name="runtime"][value="${panel.dataset.runtime}"]`)?.dataset.language
  const wanted = language && language !== 'all' ? (REGISTRIES_OF[language] ?? []) : Object.keys(registries)
  const table = panel.querySelector('table.sortable')
  const heads = [...table.querySelectorAll('thead tr:last-child th')].map((th) => (th.querySelector('[data-sort]') ?? th).textContent.trim())
  const rows = []
  for (const [registry, name, version, use, share, category, categoryUrl, rank, status] of packages) {
    if (!wanted.includes(registry)) continue
    const row = document.createElement('tr')
    row.className = 'unmeasured'
    row.dataset.status = status
    for (const [i, head] of heads.entries()) {
      const cell = document.createElement('td')
      const link = (href, text) => Object.assign(document.createElement('a'), { href, textContent: text })
      if (i === 0) {
        const ver = Object.assign(document.createElement('span'), { className: 'ver', textContent: version ?? '', title: version ?? '' })
        const named = link(`/${registry}/${name}/`, name)
        // Long names are cut short in the table; the whole name is in the tooltip.
        named.title = name
        cell.append(named, ver)
      } else if (head === 'Use') {
        cell.dataset.v = share
        cell.title = registries[registry].measure
        cell.textContent = use >= 1e9 ? `${(use / 1e9).toFixed(1)}B` : use >= 1e6 ? `${(use / 1e6).toFixed(use >= 1e7 ? 0 : 1)}M` : use >= 1e3 ? `${(use / 1e3).toFixed(use >= 1e4 ? 0 : 1)}K` : String(use)
      } else if (head === 'Rank') {
        cell.dataset.v = rank
        cell.title = `In ${registries[registry].title}, by ${registries[registry].measure}`
        cell.textContent = rank
      } else if (head === 'Status') {
        cell.className = 'l'
        cell.textContent = status
      } else if (head === 'Language') {
        cell.className = 'l'
        cell.textContent = LANGUAGE_OF[registry]
      } else if (head === 'Categories') {
        cell.className = 'l categories'
        if (category) cell.append(link(categoryUrl, category))
      } else if (head === 'Ecosystem') {
        cell.className = 'l'
        const mark = document.querySelector(`.side a[href="/${registry}/"] .ico`)
        if (mark) cell.append(mark.cloneNode(true))
        cell.append(link(`/${registry}/`, registries[registry].title))
      } else {
        cell.className = 'na'
        cell.textContent = '—'
      }
      row.append(cell)
    }
    rows.push(row)
  }
  // The new rows join the list without entering the document; the pager
  // puts a page of them there.
  table.allRows = [...rowsOf(table), ...rows]
  paginate(table)
  table.dispatchEvent(new Event('grown'))
}
for (const host of document.querySelectorAll('.pick[data-catalog]')) {
  const shown = () => [...host.querySelectorAll('.panel')].filter((panel) => panel.offsetParent).forEach((panel) => fillPanel(host, panel))
  host.addEventListener('change', () => setTimeout(shown, 0))
  shown()
}

// Table headings stay in view under the site's top bar while their table
// scrolls past. A heading cannot be "sticky" itself: its table sits in a box
// that scrolls sideways, and it would stick to that box, not the page. So a
// copy of the heading row sits just above the box, laid over the real one,
// and the browser keeps that copy stuck under the bar (plain CSS, so it moves
// with the scroll without any script running). The script only keeps the
// copy the same as the original: its widths, its sort arrows, and how far
// the table has been scrolled sideways. Clicks on it go to the real headings.
const topBar = document.querySelector('header.top')
if (topBar) new ResizeObserver(() => document.documentElement.style.setProperty('--bar', `${Math.round(topBar.getBoundingClientRect().height)}px`)).observe(topBar)
function stickHead(table) {
  const scroll = table.closest('.scroll')
  if (!scroll || !table.tHead || table.headHolder) return
  const holder = document.createElement('div')
  holder.className = 'sticky-head'
  holder.setAttribute('aria-hidden', 'true')
  const copy = document.createElement('table')
  copy.className = 'head-copy'
  holder.append(copy)
  table.headHolder = holder
  scroll.before(holder)
  const sync = () => {
    const height = table.tHead.getBoundingClientRect().height
    holder.hidden = height === 0
    if (height === 0) return
    const head = table.tHead.cloneNode(true)
    const originals = [...table.tHead.querySelectorAll('th')]
    ;[...head.querySelectorAll('th')].forEach((th, i) => {
      const width = originals[i].getBoundingClientRect().width
      th.style.width = th.style.minWidth = th.style.maxWidth = `${width}px`
      const button = th.querySelector('[data-sort]')
      // The copy is for the eye and the mouse; keyboards and screen readers use the real heading.
      if (button) {
        button.tabIndex = -1
        button.addEventListener('click', () => originals[i].querySelector('[data-sort]')?.click())
      }
    })
    copy.replaceChildren(head)
    copy.style.width = `${table.getBoundingClientRect().width}px`
    holder.style.height = `${height}px`
    holder.style.marginBottom = `${-height}px`
    holder.scrollLeft = scroll.scrollLeft
  }
  scroll.addEventListener('scroll', () => (holder.scrollLeft = scroll.scrollLeft), { passive: true })
  new ResizeObserver(sync).observe(table)
  for (const event of ['sorted', 'filtered', 'grown']) table.addEventListener(event, () => requestAnimationFrame(sync))
  sync()
}
for (const table of document.querySelectorAll('table.sortable')) stickHead(table)

// In the menu on a phone, tapping a group opens it in place instead of
// leaving for the group's page: a finger cannot hover to see what is inside,
// and a page load for every look is slow. The group's own page is the first
// line of the opened list.
const phone = matchMedia('(max-width: 760px)')
let menuData = null
document.querySelector('.side-categories')?.addEventListener('click', async (event) => {
  const head = event.target.closest('.side-categories > li > a')
  if (!head || !phone.matches) return
  event.preventDefault()
  const item = head.parentElement
  let list = item.querySelector(':scope > ul')
  if (list) {
    list.hidden = !list.hidden
    item.classList.toggle('open', !list.hidden)
    return
  }
  menuData ??= fetch('/data/menu.json').then((r) => r.json())
  const group = head.getAttribute('href').split('/').filter(Boolean).at(-1)
  list = document.createElement('ul')
  const line = (text, href, count) => {
    const li = document.createElement('li')
    const a = Object.assign(document.createElement('a'), { href, textContent: text })
    if (count) a.append(' ', Object.assign(document.createElement('span'), { className: 'count', textContent: count }))
    li.append(a)
    return li
  }
  // The group's name is the text of the heading, apart from its icon and count.
  const name = [...head.childNodes].filter((node) => node.nodeType === 3).map((node) => node.textContent).join('').trim()
  list.append(line(`All of ${name}`, head.href), ...((await menuData)[group] ?? []).map(([title, href, , count]) => line(title, href, count)))
  item.append(list)
  item.classList.add('open')
})

// --- Menus --------------------------------------------------------------------

// A short message that confirms a copy or reports why it failed. It appears
// just above where the reader last clicked, since that is where they are
// looking. `hold` keeps it up until the next message replaces it.
let toastTimer
let lastClick = null
document.addEventListener('pointerdown', (event) => (lastClick = { x: event.clientX, y: event.clientY }), true)
function toast(content, { hold = false } = {}) {
  let box = document.querySelector('.toast')
  if (!box) {
    box = document.createElement('div')
    box.className = 'toast'
    box.setAttribute('role', 'status')
    document.body.append(box)
  }
  box.replaceChildren(content)
  box.hidden = false
  const { width, height } = box.getBoundingClientRect()
  const at = lastClick ?? { x: innerWidth / 2, y: innerHeight - 24 }
  box.style.left = `${Math.min(Math.max(8, at.x - width / 2), innerWidth - width - 8)}px`
  box.style.top = `${at.y - height - 14 < 8 ? at.y + 18 : at.y - height - 14}px`
  clearTimeout(toastTimer)
  if (!hold) toastTimer = setTimeout(() => (box.hidden = true), 2400)
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
    toast('The browser blocked the copy.')
  }
}

function save(blob, name) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000)
}

// "Copy page" copies what the reader has on screen. The Markdown file holds
// every row of every table; where the page shows a table a page at a time,
// filtered or sorted, that table is swapped for the rows on show, under a line
// saying which rows they are and how they were chosen.
// A cell's visible text, piece by piece, so a name, its version and a class
// letter do not run together. Class letters go in brackets.
function cellText(cell) {
  const pieces = []
  const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.replace(/\s+/g, ' ').trim()
    if (!text || node.parentElement.getClientRects().length === 0) continue
    pieces.push(node.parentElement.classList.contains('cls') ? `(${text})` : text)
  }
  return pieces.join(' ').replace(/\|/g, '\\|')
}
function tableOnScreen(table, fullUrl) {
  const headings = [...table.querySelectorAll('thead tr:last-child th')]
  const titles = headings.map((th) => (th.querySelector('[data-sort]') ?? th).textContent.replace(/\s+/g, ' ').trim())
  const kept = rowsOf(table).filter((row) => !row.dataset.out)
  const shown = table.allRows ? [...table.tBodies[0].rows] : kept.filter((row) => !row.hidden)
  const lines = shown.map((row) => {
    const cells = [...row.cells].map(cellText)
    const link = row.cells[0].querySelector('a[href]')
    const name = link?.textContent.replace(/\s+/g, ' ').trim()
    if (name) cells[0] = cells[0].replace(name, `[${name}](${link.href})`)
    return `| ${cells.join(' | ')} |`
  })
  // Which rows, and the switches and sort order that chose them.
  const first = kept.indexOf(shown[0]) + 1
  const state = [shown.length === kept.length ? `All ${kept.length.toLocaleString('en-US')} rows` : `Rows ${first.toLocaleString('en-US')}–${(first + shown.length - 1).toLocaleString('en-US')} of ${kept.length.toLocaleString('en-US')}`]
  const bars = new Set([(table.headHolder ?? table.closest('.scroll'))?.previousElementSibling, table.closest('.pick')?.querySelector(':scope > .switches')].filter((bar) => bar?.classList.contains('switches')))
  for (const bar of bars) {
    for (const group of bar.querySelectorAll('.switch:not([hidden])')) {
      const checked = [...group.querySelectorAll('input')].find((input) => input.checked && !input.hidden)
      const label = checked?.nextElementSibling
      if (label) state.push(`${group.getAttribute('aria-label')}: ${[...label.childNodes].filter((node) => node.nodeType === 3).map((node) => node.textContent).join('').trim() || label.textContent.trim()}`)
    }
  }
  const sorted = headings.findIndex((th) => th.hasAttribute('aria-sort'))
  if (sorted >= 0) state.push(`sorted by ${titles[sorted]}${headings[sorted].dataset.field ? ` (${FIELD_LABELS[headings[sorted].dataset.field] ?? headings[sorted].dataset.field})` : ''}, ${headings[sorted].getAttribute('aria-sort')}`)
  return `> ${state.join('; ')}. This is the table as it was on the page when copied; every row is in ${fullUrl}\n\n| ${titles.join(' | ')} |\n| ${titles.map(() => '---').join(' | ')} |\n${lines.join('\n')}`
}
function asOnScreen(text, fullUrl) {
  return text.replace(/<!-- table:([a-z]+) -->\n[\s\S]*?\n<!-- \/table -->/g, (block, key) => {
    const table = [...document.querySelectorAll(`table[data-md="${key}"]`)].find((candidate) => candidate.offsetParent)
    return table ? tableOnScreen(table, fullUrl) : block
  })
}

// The page as Markdown, ready to paste into a language model.
for (const menu of document.querySelectorAll('.page-menu')) {
  const markdown = new URL(menu.dataset.markdown, location.href).href
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'copy-page'
  button.append(menu.querySelector('summary svg').cloneNode(true), 'Copy page')
  button.title = 'Copy this page as Markdown, ready to paste into a language model'
  button.addEventListener('click', () => copy('text/plain', fetch(markdown).then((r) => r.text()).then((text) => asOnScreen(text, markdown)), 'Page copied as Markdown, as shown'))
  menu.prepend(button)
  menu.classList.add('split')
  menu.querySelector('summary').setAttribute('aria-label', 'More ways to copy and download')
  // Each assistant takes a question in the address of a new chat. They read
  // the page from its address, so this works once the site is public.
  const question = encodeURIComponent(`Read ${markdown} and help me understand these package efficiency results.`)
  const ASSISTANT_LINKS = {
    chatgpt: `https://chatgpt.com/?hints=search&q=${question}`,
    claude: `https://claude.ai/new?q=${question}`,
    perplexity: `https://www.perplexity.ai/search?q=${question}`,
    grok: `https://grok.com/?q=${question}`,
    deepseek: `https://chat.deepseek.com/?q=${question}`,
  }
  // These take no question in the address: the question is copied instead,
  // ready to paste once the chat opens.
  const PASTE_INTO = { kimi: 'https://www.kimi.com/', zai: 'https://chat.z.ai/' }
  for (const link of menu.querySelectorAll('[data-assistant]')) {
    const id = link.dataset.assistant
    link.href = ASSISTANT_LINKS[id] ?? PASTE_INTO[id]
    link.target = '_blank'
    if (!PASTE_INTO[id]) continue
    link.title += ' (copies the question to paste there)'
    // The question is copied, then the chat opens after a short countdown, so
    // there is time to read that it needs pasting. If the browser will not
    // open a tab that late, the message turns into the link itself.
    link.addEventListener('click', async (event) => {
      event.preventDefault()
      const name = link.querySelector('small').textContent
      try {
        await navigator.clipboard.writeText(decodeURIComponent(question))
      } catch {
        return toast('The browser blocked the copy.')
      }
      for (let seconds = 3; seconds > 0; seconds--) {
        toast(`Question copied. Paste it into ${name}, opening in ${seconds}…`, { hold: true })
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      // (No "noopener" here: with it the call reports nothing even when the
      // tab opens, and whether it opened is what decides the next message.)
      const opened = window.open(link.href, '_blank')
      if (opened) {
        opened.opener = null
        return toast(`Question copied. Paste it into ${name}.`)
      }
      const open = document.createElement('a')
      open.href = link.href
      open.target = '_blank'
      open.rel = 'noopener'
      open.textContent = `Question copied. Open ${name} and paste it`
      open.addEventListener('click', () => toast(`Question copied. Paste it into ${name}.`))
      toast(open, { hold: true })
    })
  }
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

const ACTION_ICONS = {
  copy: 'M5 1h9v10h-3v3H2V4h3zm1.500 3H11v5.500h1.500v-7h-6zM3.500 5.500v7h6v-7z',
  save: 'M7.250 1.500h1.500v6.700l2.200-2.200 1.050 1.050L8 11.050 4 7.050 5.050 6l2.200 2.200zM2.500 12.500h11V14h-11z',
  link: 'M6.500 4.500H4a3.500 3.500 0 0 0 0 7h2.500V10H4a2 2 0 0 1 0-4h2.500zM9.500 4.500H12a3.500 3.500 0 0 1 0 7H9.500V10H12a2 2 0 0 0 0-4H9.500zM5 7.250h6v1.500H5z',
  open: 'M3 3h5v1.500H4.500v7h7V8H13v5H3zM9.500 2H14v4.500h-1.500V4.560L8.530 8.530 7.470 7.470 11.440 3.500H9.500z',
  embed: 'M5.500 4l1.060 1.060L3.620 8l2.940 2.940L5.500 12l-4-4zM10.500 4l4 4-4 4-1.060-1.060L12.380 8 9.440 5.060z',
}
const actionIcon = (id) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('class', 'ico')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', ACTION_ICONS[id])
  path.setAttribute('fill', 'currentColor')
  path.setAttribute('fill-rule', 'evenodd')
  svg.append(path)
  return svg
}
// The site's one dialog: a title bar with a close button, and a body that
// scrolls. Opens it empty and returns the body to fill.
function sheet(title, kind) {
  let dialog = document.querySelector('dialog.sheet')
  if (!dialog) {
    dialog = document.createElement('dialog')
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog || event.target.closest('[data-close]')) dialog.close()
      const button = event.target.closest('[data-copy]')
      if (button) copy('text/plain', button.previousElementSibling.textContent, `${button.dataset.copy} copied`)
    })
    document.body.append(dialog)
  }
  dialog.className = `sheet sheet-${kind}`
  dialog.replaceChildren()
  const head = document.createElement('div')
  head.className = 'sheet-head'
  const heading = document.createElement('h2')
  heading.textContent = title
  const close = document.createElement('button')
  close.type = 'button'
  close.dataset.close = ''
  close.setAttribute('aria-label', 'Close')
  close.title = 'Close'
  close.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.500 3.500l9 9M12.500 3.500l-9 9" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>'
  head.append(heading, close)
  const body = document.createElement('div')
  body.className = 'sheet-body'
  dialog.append(head, body)
  dialog.showModal()
  body.scrollTop = 0
  return body
}

// Reporting a problem or reviewing a benchmark happens on GitHub, in an issue
// form. The dialog asks what the reader wants to say and opens the right
// form, filled in with what the page is about.
const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.65 2.32Q8.00 -0.05 10.35 2.32Q13.69 2.31 13.68 5.65Q16.05 8.00 13.68 10.35Q13.69 13.69 10.35 13.68Q8.00 16.05 5.65 13.68Q2.31 13.69 2.32 10.35Q-0.05 8.00 2.32 5.65Q2.31 2.31 5.65 2.32zM11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z" fill="currentColor" fill-rule="evenodd"/><path d="M11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z" fill="#fff"/></svg>'
const ROUND_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" fill="currentColor"/><path d="M7.500 3.300a1.400 1.400 0 1 0 0 2.800 1.400 1.400 0 0 0 0-2.800zM6.100 6.500h2.650v6.600H7.900v-3.100h-.550v3.100H6.500V7.900h-.250v2.300H5.200V7.400a.900.900 0 0 1 .900-.900z" fill="#fff"/><path d="M8.750 6.500h1.880a.550.550 0 0 1 0 1.100H8.750z" fill="#fff"/><path class="wave-arm" d="M10.080 7.050V4.600h1.100v2.450a.550.550 0 0 1-1.100 0z" fill="#fff"/></svg>'
const PENCIL = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.300 1.700a1 1 0 0 1 1.400 0l1.600 1.600a1 1 0 0 1 0 1.400L6 13H3v-3zM2 14.500h12V16H2z" fill="currentColor"/></svg>'
// The icon before each choice: the two checks, or a plain mark for the rest.
const plainIcon = (d) => `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="currentColor" fill-rule="evenodd"/></svg>`
const CHOICE_ICONS = {
  maintainer: () => CHECK,
  human: () => ROUND_CHECK,
  edit: () => PENCIL,
  wrong: () => plainIcon('M8 1.500l7 12.500H1zM7.250 6v4h1.500V6zm0 5v1.500h1.500V11z'),
  code: () => plainIcon('M5.500 4l1.060 1.060L3.620 8l2.940 2.940L5.500 12l-4-4zM10.500 4l4 4-4 4-1.060-1.060L12.380 8 9.440 5.060z'),
  category: () => plainIcon('M1.500 3h5L8 4.500h6.500V13h-13z'),
  add: () => plainIcon('M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.750 3.500h1.500v2.750h2.750v1.500H8.750v2.750h-1.500V8.750H4.500v-1.500h2.750z'),
  comment: () => plainIcon('M2 2h12v9H8.500L5 14v-3H2z'),
}
function issueUrl(template, title, fields) {
  const query = new URLSearchParams(template ? { template } : {})
  query.set('title', title)
  for (const [id, value] of Object.entries(fields)) if (value) query.set(id, value)
  return `${document.body.dataset.repo}/issues/new?${query}`
}
function feedbackDialog(holder, act) {
  const d = holder.dataset
  const common = { package: d.fbPackage, task: d.fbTask, page: d.fbPage }
  // What each form has a field for, besides those.
  const extra = { '1-result-looks-wrong.yml': { runtime: d.fbRuntime }, '3-wrong-category.yml': { current: d.fbCategory, task: '' } }
  const about = d.fbAbout
  // For a maintainer, both choices open the same form with the verdict set.
  // A review by anyone else is one of the things a reader can report.
  const choices = act === 'vouch'
    ? [
        ['5-maintainer-review.yml', `Maintainer review: ${about}`, 'Yes, and the benchmark uses it correctly', 'Confirm it. A benchmark that its authors confirm gets a blue check.', 'maintainer', { verdict: 'The benchmark is correct as it is' }],
        ['5-maintainer-review.yml', `Maintainer review: ${about}`, 'Yes, and the benchmark needs changes', 'Say what it must do differently. It gets the blue check when they are in.', 'edit', { verdict: 'It is correct after the changes below' }],
      ]
    : [
        d.fbScope !== 'listed' && ['1-result-looks-wrong.yml', `Result looks wrong: ${about}`, 'A result looks wrong', 'A figure or a class does not match what you measure or expect.', 'wrong'],
        d.fbScope !== 'listed' && ['2-benchmark-not-correct.yml', `Benchmark not correct: ${about}`, 'The benchmark does not use the package correctly', 'The wrong API, a missing setting, or work that other entries do not do.', 'code'],
        d.fbPackage && ['3-wrong-category.yml', `Wrong category: ${about}`, 'It is in the wrong category', 'The package does a different job from the others beside it.', 'category'],
        ['4-suggestion.yml', `Suggestion: ${about}`, 'Suggest a package, version, setting or task', 'Something to add, or to measure differently.', 'add'],
        d.fbScope !== 'listed' && d.fbScope !== 'task' && ['6-independent-review.yml', `Review: ${about}`, 'I read the benchmark code and reviewed it', 'Say if it is correct. A benchmark that a person other than its author reviewed gets a grey reviewer mark.', 'human'],
        [null, `${about}: `, 'Something else', 'A comment or a question, in an empty issue.', 'comment'],
      ].filter(Boolean)
  const body = sheet(act === 'vouch' ? 'Is this package yours?' : 'Report a problem or suggest a change', 'feedback')
  const intro = document.createElement('p')
  intro.className = 'soft'
  intro.append(act === 'vouch'
    ? `For the maintainers of ${about}. First read the code that runs the package`
    : `About ${about}. Each choice opens a form on GitHub, filled in with this page. You need a GitHub account.`)
  if (act === 'vouch') {
    if (d.fbCode) {
      const code = Object.assign(document.createElement('a'), { href: d.fbCode, textContent: 'the benchmark code' })
      intro.append(': ', code)
    }
    intro.append('. Then tell us on GitHub what you found.')
  }
  const list = document.createElement('ul')
  list.className = 'choices'
  for (const [template, title, name, detail, check, preset] of choices) {
    const item = document.createElement('li')
    const link = Object.assign(document.createElement('a'), { href: issueUrl(template, title, { ...common, ...extra[template], ...preset }), target: '_blank', rel: 'noopener' })
    const strong = document.createElement('b')
    if (check) {
      const mark = document.createElement('span')
      // The pencil goes with the blue badge above it; the report icons are grey, like the review check among them.
      mark.className = `verified ${check === 'maintainer' || check === 'human' ? check : check === 'edit' ? 'plain blue' : 'plain'}`
      mark.innerHTML = CHOICE_ICONS[check]()
      strong.append(mark)
    }
    strong.append(name)
    const small = document.createElement('small')
    small.textContent = detail
    const go = document.createElement('span')
    go.className = 'go'
    go.append('Open on GitHub', actionIcon('open'))
    link.append(strong, small, go)
    item.append(link)
    list.append(item)
  }
  body.append(intro, list)
  if (act === 'vouch') {
    const note = document.createElement('p')
    note.className = 'sheet-note'
    note.textContent = 'We confirm that the review comes from a maintainer before a blue check appears.'
    // Anyone else is sent to the other dialog, about the same thing.
    const other = document.createElement('p')
    other.className = 'sheet-note'
    const link = Object.assign(document.createElement('a'), { href: `${document.body.dataset.repo}/issues/new/choose`, textContent: 'Send feedback anyway' })
    link.addEventListener('click', (event) => {
      event.preventDefault()
      feedbackDialog(holder, 'report')
    })
    other.append('Not a maintainer or author? ', link, '.')
    body.append(note, other)
  }
}
document.addEventListener('click', (event) => {
  const link = event.target.closest('a.act[data-act]')
  const holder = link?.closest('.feedback')
  if (!holder || !document.body.dataset.repo || event.metaKey || event.ctrlKey || event.shiftKey) return
  event.preventDefault()
  feedbackDialog(holder, link.dataset.act)
})

// One label in every shape it comes in, each with the text that embeds it:
// Markdown for a README, HTML for a page. The shapes are files whose
// addresses stay put, so an embedded label follows new measurements.
function embedDialog(holder) {
  const { embed, embedPage, embedAlt, ranking, labelPattern } = holder.dataset
  const site = document.body.dataset.site || location.origin
  const page = new URL(embedPage, site).href
  const names = { cpu: 'CPU', memory: 'Memory', types: 'Type check', all: 'Combined' }
  const tabs = [...(holder.dataset.embedRankings ?? ranking).split(',').filter((id) => names[id]), 'all']
  // What there is of each: a measure has its own label in four sizes; the
  // combined ones carry all three classes.
  const shapesOf = (id) => id === 'all'
    ? [
        ['Overview', `${embed}overview.svg`, 'CPU, memory and type check on one label.'],
        ['Badge', `${embed}badge.svg`, 'One line for a README, with every class.'],
        ['Badge, flat', `${embed}badge.flat.svg`, 'The same line with square corners and no shading.'],
      ]
    : [
        ['Label', labelPattern ? labelPattern.replace('{r}', id) : holder.dataset.label, 'The full label.'],
        ['Compact', `${embed}compact.${id}.svg`, 'A small label: name, scale and figure.'],
        ['Wide', `${embed}wide.${id}.svg`, 'A label lying down, for a header or a slide.', true],
        ['Button', `${embed}button.${id}.svg`, '88 by 31, like the buttons of old web pages.'],
        ['Badge', `${embed}badge.${id}.svg`, 'One line for a README, with this class alone.'],
        ['Badge, flat', `${embed}badge.${id}.flat.svg`, 'The same line with square corners and no shading.'],
      ]
  const body = sheet('Embed this label', 'embed')
  const bar = document.createElement('div')
  bar.className = 'sheet-tabs'
  bar.setAttribute('role', 'tablist')
  body.before(bar)
  const show = (id) => {
    for (const tab of bar.children) tab.setAttribute('aria-selected', tab.dataset.tab === id)
    body.replaceChildren()
    body.scrollTop = 0
    const alt = id === 'all' ? embedAlt : `${embedAlt}: ${names[id]}`
    const about = document.createElement('p')
    about.className = 'soft'
    about.textContent = `${alt}. Each address stays the same and shows the newest measurement.`
    body.append(about)
    for (const [name, file, note, full] of shapesOf(id).filter(([, file]) => file)) {
      const src = new URL(file, site).href
      const shape = document.createElement('div')
      shape.className = 'embed-shape'
      const heading = document.createElement('h3')
      heading.textContent = name
      const says = document.createElement('p')
      says.className = 'soft'
      says.textContent = note
      const image = document.createElement('img')
      image.src = file
      image.alt = alt
      // Its size in pixels, said beside its name once the file has arrived.
      image.addEventListener('load', () => {
        if (!image.naturalWidth) return
        const size = document.createElement('span')
        size.className = 'embed-size'
        size.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`
        heading.append(size)
      })
      // A shape that does not exist for this result takes its section with it.
      image.addEventListener('error', () => shape.remove())
      // The fields sit beside the shape where there is room, level with its
      // name; a shape that needs the whole row has them underneath.
      if (!full) shape.classList.add('beside')
      const main = document.createElement('div')
      main.className = 'embed-main'
      const codes = document.createElement('div')
      codes.className = 'embed-codes'
      main.append(heading, says, image)
      shape.append(main, codes)
      for (const [kind, text] of [['Markdown', `[![${alt}](${src})](${page})`], ['HTML', `<a href="${page}"><img src="${src}" alt="${alt}"></a>`]]) {
        const row = document.createElement('p')
        row.className = 'embed-code'
        const tag = document.createElement('b')
        tag.textContent = kind
        const code = document.createElement('code')
        code.textContent = text
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.copy = kind
        button.title = `Copy ${kind}`
        button.append(actionIcon('copy'))
        row.append(tag, code, button)
        codes.append(row)
      }
      body.append(shape)
    }
  }
  for (const id of tabs) {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.setAttribute('role', 'tab')
    tab.dataset.tab = id
    tab.textContent = names[id]
    tab.addEventListener('click', () => show(id))
    bar.append(tab)
  }
  show(tabs.includes(ranking) ? ranking : 'all')
}
const LABEL_ICONS = { 'Copy as PNG': 'copy', 'Copy as SVG': 'copy', 'Save PNG': 'save', 'Save SVG': 'save', 'Copy link': 'link', 'Open SVG': 'open' }
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
      control.append(actionIcon(LABEL_ICONS[text]), text)
      control.addEventListener('click', () => action(svg, holder.dataset.label))
      item.append(control)
      list.append(item)
    }
    menu.append(list)
  })
  // The menu sits in the strip above the label, on the side away from any
  // place tag; a label without that strip gets one.
  let over = holder.querySelector(':scope > .over')
  if (!over) {
    over = document.createElement('p')
    over.className = 'over'
    holder.prepend(over)
  }
  // What can be done with the label sits together at the right of that
  // strip: embedding it elsewhere, then the menu. Tags about the label are
  // on the left, and links to other pages are below it.
  const actions = document.createElement('span')
  actions.className = 'label-actions'
  if (holder.dataset.embed) {
    const embed = document.createElement('button')
    embed.type = 'button'
    embed.className = 'label-embed'
    embed.title = 'Embed this label'
    embed.append(actionIcon('embed'), 'Embed')
    embed.addEventListener('click', () => embedDialog(holder))
    actions.append(embed)
  }
  actions.append(menu)
  over.append(actions)
}
