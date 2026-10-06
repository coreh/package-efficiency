import { compareCells, sortColumnKey, matchingSortColumn } from './sort.mjs'

// Progressive enhancement only: every page works without this file.

// Search across packages, tasks and categories.
const input = document.getElementById('q')
const results = document.getElementById('q-results')
let entries = null
async function search() {
  entries ??= await fetch('/search.json').then((r) => r.json())
  const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  results.replaceChildren()
  if (words.length === 0) return (results.hidden = true)
  const found = entries.filter((e) => words.every((w) => `${e.t} ${e.k}`.toLowerCase().includes(w))).slice(0, 12)
  for (const e of found) {
    const item = document.createElement('li')
    const link = document.createElement('a')
    const kind = document.createElement('small')
    link.href = e.u
    link.textContent = e.t
    kind.textContent = e.k
    link.append(kind)
    item.append(link)
    results.append(item)
  }
  if (found.length === 0) {
    const item = document.createElement('li')
    item.textContent = 'Nothing matches. Try a package or task name.'
    results.append(item)
  }
  results.hidden = false
}
input?.addEventListener('input', search)
input?.addEventListener('focus', search)
input?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') results.hidden = true
  if (event.key === 'Enter') results.querySelector('a')?.click()
})
document.addEventListener('click', (event) => {
  if (!event.target.closest('.search')) results.hidden = true
})

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
