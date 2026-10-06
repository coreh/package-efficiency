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
const STATUS_ORDER = ['Measured', 'Not benchmarked yet', 'Not measured yet', 'No comparable task']
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
  ;(table.closest('.scroll') ?? table).before(row)
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
        if (place === 'below') wrapper.previousElementSibling.scrollIntoView({ block: 'nearest' })
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
  let bar = wrapper.previousElementSibling?.classList.contains('switches') ? wrapper.previousElementSibling : table.closest('.pick')?.querySelector(':scope > .switches')
  if (!bar) {
    bar = document.createElement('div')
    bar.className = 'switches'
    wrapper.before(bar)
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
  const table = panel.querySelector('table')
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
  const bars = new Set([table.closest('.scroll')?.previousElementSibling, table.closest('.pick')?.querySelector(':scope > .switches')].filter((bar) => bar?.classList.contains('switches')))
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
        return toast('Copying was blocked by the browser.')
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
