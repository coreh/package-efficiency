// The compare page: two results of one task side by side, their labels and
// their figures. The address holds the choice (?t=task&r=ranking&a=…&b=…,
// where a side is runtime:entry), so a comparison can be shared. With a scope
// instead of a task (?s=scope&basis=best|typical&a=…&b=…, where a side is a
// runtime), it puts two runtimes' summary labels side by side.
import { toDisplay } from './units.mjs'

const config = JSON.parse(document.getElementById('cmp-config').textContent)
const intro = document.getElementById('cmp-task')
const rankingBar = document.getElementById('cmp-rankings')
const sidesBox = document.getElementById('cmp-sides')
const figures = document.getElementById('cmp-figures')
const linkRow = document.getElementById('cmp-link-row')
const sides = Object.fromEntries([...document.querySelectorAll('.cmp-side')].map((el) => [el.dataset.side, { el, select: el.querySelector('select'), label: el.querySelector('.cmp-label') }]))

const params = new URLSearchParams(location.search)
const state = { t: params.get('t') ?? '', s: params.get('s') ?? '', basis: params.get('basis') === 'typical' ? 'typical' : 'best', r: params.get('r') ?? 'cpu', a: params.get('a') ?? '', b: params.get('b') ?? '' }
// Two runtimes in a scope, or two results of a task.
const runtimeMode = !state.t && !!state.s
const BASES = { best: 'Best entry', typical: 'Typical entry' }
let data = null
const entries = new Map()

const el = (tag, text, className) => {
  const node = document.createElement(tag)
  if (text != null) node.textContent = text
  if (className) node.className = className
  return node
}
const ink = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 150 ? '#000' : '#fff'
}
const number = (n) => (n == null ? '' : n >= 100 ? Math.round(n).toLocaleString('en-US') : String(Number(n.toPrecision(3))))
const keyOf = (runtime, entry) => `${runtime.id}:${entry.id}`
// The address of an entry's label and of its result page, as the site writes them.
const baseId = (entry) => entry.id.replace(/(?<=[^/])@[^/@]+$/, '')
const labelUrl = (runtime, entry, ranking) => `/labels/${state.t}/${runtime.id}/${baseId(entry)}${entry.id !== baseId(entry) ? `@${entry.version}` : ''}.${ranking}.svg`
const resultUrl = (runtime, entry) => `/results/${state.t}/${runtime.id}/${baseId(entry)}${entry.version ? `@${entry.version}` : ''}/`

// A runtime's summary label and page in the scope.
const summaryLabelUrl = (runtime, ranking) => `/embed/runtimes/${runtime.id}/${state.s}/${state.basis}/label.${ranking}.svg`
const summaryUrl = (runtime) => `/results/runtimes/${runtime.id}/${state.s}/`

function remember() {
  const next = new URLSearchParams()
  for (const name of runtimeMode ? ['s', 'basis', 'r', 'a', 'b'] : ['t', 'r', 'a', 'b']) if (state[name] && !(name === 'r' && state.r === 'cpu') && !(name === 'basis' && state.basis === 'best')) next.set(name, state[name])
  history.replaceState(null, '', `?${next}`)
}

// What each row of the table shows: a title and the figure of an entry.
function rows() {
  if (runtimeMode) {
    const out = Object.keys(config.rankings).map((id) => [`${config.rankings[id].title} class`, (e) => e.grades[id]?.[state.basis]?.class ?? null, 'class', id])
    const ratio = (id) => (e) => e.grades[id]?.[state.basis]?.ratio ?? null
    out.push(
      ['CPU, times the best', ratio('cpu')],
      ['Memory, times the best', ratio('memory')],
      ['Type check, times the best', ratio('types')],
      ['Entries', (e) => e.entries ?? null, 'count'],
      ['Tasks', (e) => e.tasks ?? null, 'count'],
    )
    return out
  }
  const cpuUnit = data.metrics.cpu?.displayUnit ?? 'µs'
  const out = Object.keys(config.rankings).map((id) => [`${config.rankings[id].title} class`, (e) => e.grades?.[id]?.class ?? null, 'class', id])
  out.push(
    [data.metrics.cpu?.headline ?? `CPU (${cpuUnit})`, (e) => toDisplay(e.metrics?.cpuMs, cpuUnit)],
    [data.metrics.memory?.headline ?? 'Memory (MB)', (e) => toDisplay(e.metrics?.memoryBytes, 'MB'), 'floor'],
    ['Total memory, MB', (e) => toDisplay(e.metrics?.totalMemoryBytes, 'MB')],
    ['Peak memory, MB', (e) => toDisplay(e.metrics?.peakMemoryBytes, 'MB')],
    ['Type check, MB·s', (e) => e.grades?.types?.value ?? null],
    ['Import, ms', (e) => e.metrics?.importMs ?? null],
    ['Install size, MB', (e) => toDisplay(e.metrics?.installBytes, 'MB')],
    ['Installed packages', (e) => e.metrics?.installPackages ?? null],
  )
  return out
}

function chip(ranking, letter) {
  if (!letter) return ''
  const color = config.rankings[ranking].colors[config.classes.indexOf(letter)]
  const span = el('span', letter, 'cls')
  span.style.background = color
  span.style.color = ink(color)
  return span
}

async function showLabel(side) {
  const box = sides[side].label
  const picked = entries.get(state[side])
  box.replaceChildren()
  if (!picked) {
    box.append(el('p', side === 'b' ? 'Pick a result to compare with.' : 'Pick a result.', 'cmp-empty'))
    return
  }
  const { runtime, entry } = picked
  const graded = runtimeMode ? entry.grades[state.r]?.[state.basis]?.class : entry.grades?.[state.r]?.class || entry.grades?.[state.r]?.reference
  if (!graded) box.append(el('p', `No ${config.rankings[state.r].title.toLowerCase()} label for this ${runtimeMode ? 'runtime here' : 'result'}.`, 'cmp-empty'))
  else {
    const response = await fetch(runtimeMode ? summaryLabelUrl(runtime, state.r) : labelUrl(runtime, entry, state.r))
    if (entries.get(state[side]) !== picked) return
    if (response.ok) box.innerHTML = await response.text()
    else box.append(el('p', 'The label could not be loaded.', 'cmp-empty'))
  }
  const open = el('a', runtimeMode ? 'Open this summary' : 'Open this result', 'cmp-open')
  open.href = runtimeMode ? summaryUrl(runtime) : resultUrl(runtime, entry)
  box.append(open)
}

function showTable() {
  const a = entries.get(state.a)
  const b = entries.get(state.b)
  figures.hidden = !a && !b
  linkRow.hidden = !(a && b)
  const name = (picked) => (picked ? runtimeMode ? picked.runtime.title : `${picked.entry.title} on ${picked.runtime.title}` : '')
  document.getElementById('cmp-head-a').textContent = name(a)
  document.getElementById('cmp-head-b').textContent = name(b)
  const body = figures.tBodies[0]
  body.replaceChildren()
  for (const [title, get, kind, ranking] of rows()) {
    const x = a ? get(a.entry) : null
    const y = b ? get(b.entry) : null
    if (x == null && y == null) continue
    const tr = document.createElement('tr')
    tr.append(el('th', title, 'l'))
    for (const v of [x, y]) {
      const td = el('td')
      if (kind === 'class') td.append(chip(ranking, v))
      // Below what can be measured, as the label prints it.
      else td.textContent = kind === 'floor' && v === 0 ? '< 0.01' : number(v)
      tr.append(td)
    }
    const ratio = kind !== 'class' && kind !== 'count' && x > 0 && y != null ? `${number(y / x)}×` : ''
    tr.append(el('td', ratio, 'cmp-ratio'))
    // Lower is better, except for counts, which are not ranked.
    if (kind !== 'class' && kind !== 'count' && x != null && y != null && x !== y) tr.cells[x < y ? 1 : 2].classList.add('cmp-less')
    body.append(tr)
  }
}

function showRankings() {
  rankingBar.replaceChildren()
  const group = el('fieldset', null, 'switch')
  group.append(el('span', 'Label', 'legend'))
  for (const id of Object.keys(config.rankings)) {
    const input = el('input')
    input.type = 'radio'
    input.name = 'cmp-ranking'
    input.id = `cmp-r-${id}`
    input.value = id
    input.checked = state.r === id
    input.addEventListener('change', () => { state.r = id; render() })
    const label = el('label', config.rankings[id].title)
    label.htmlFor = input.id
    group.append(input, label)
  }
  rankingBar.append(group)
  if (runtimeMode) {
    const bases = el('fieldset', null, 'switch')
    bases.append(el('span', 'Compare', 'legend'))
    for (const [id, title] of Object.entries(BASES)) {
      const input = el('input')
      input.type = 'radio'
      input.name = 'cmp-basis'
      input.id = `cmp-basis-${id}`
      input.value = id
      input.checked = state.basis === id
      input.addEventListener('change', () => { state.basis = id; render() })
      const label = el('label', title)
      label.htmlFor = input.id
      bases.append(input, label)
    }
    rankingBar.append(bases)
  }
  rankingBar.hidden = false
}

function render() {
  remember()
  for (const side of ['a', 'b']) sides[side].select.value = entries.has(state[side]) ? state[side] : ''
  showLabel('a')
  showLabel('b')
  showTable()
}

function fillPickers() {
  for (const side of ['a', 'b']) {
    const select = sides[side].select
    select.replaceChildren(el('option', 'Pick a result…'))
    select.firstChild.value = ''
    if (runtimeMode) {
      for (const [key, { runtime }] of entries) {
        const option = el('option', `${runtime.title} ${runtime.version ?? ''}`.trim())
        option.value = key
        select.append(option)
      }
      select.addEventListener('change', () => { state[side] = select.value; render() })
      continue
    }
    for (const runtime of data.runtimes) {
      const group = el('optgroup')
      group.label = runtime.title
      for (const entry of runtime.entries) {
        const option = el('option', `${entry.title} ${entry.version ?? ''} on ${runtime.title}${entry.ecosystem && config.registries[entry.ecosystem] ? ` (${config.registries[entry.ecosystem]})` : ''}`)
        option.value = keyOf(runtime, entry)
        group.append(option)
      }
      if (group.children.length) select.append(group)
    }
    select.addEventListener('change', () => { state[side] = select.value; render() })
  }
}

document.getElementById('cmp-swap').addEventListener('click', () => { [state.a, state.b] = [state.b, state.a]; render() })
document.getElementById('cmp-copy').addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(location.href)
    event.target.textContent = 'Link copied'
    setTimeout(() => (event.target.textContent = 'Copy link to this comparison'), 1600)
  } catch {}
})

const task = config.tasks[state.t]
if (runtimeMode) {
  try {
    data = await fetch(`/data/summaries/${state.s}.json`).then((r) => r.json())
    intro.replaceChildren('Runtimes in ', data.href ? el('a', data.title) : data.title, `, across ${data.tasks === 1 ? 'one task' : `${data.tasks} tasks`}. Pick the two to put side by side; the address keeps the choice.`)
    if (data.href) intro.children[0].href = data.href
    // The same shape as a task's entries: a side is a runtime, and its "entry" is its summary.
    for (const [id, summary] of Object.entries(data.runtimes)) entries.set(id, { runtime: { id, title: summary.title, version: summary.version }, entry: summary })
    if (!config.rankings[state.r]) state.r = 'cpu'
    fillPickers()
    showRankings()
    sidesBox.hidden = false
    render()
    if (!entries.has(state.b)) sides.b.select.focus()
  } catch {
    intro.textContent = 'The runtimes\' summaries could not be loaded. Reload the page to try again.'
  }
} else if (task) {
  intro.replaceChildren(el('a', task.title), ` in ${task.category}. Pick the two results to put side by side; the address keeps the choice.`)
  intro.firstChild.href = `/${state.t}/`
  try {
    data = await fetch(`/data/${state.t}.json`).then((r) => r.json())
    for (const runtime of data.runtimes) for (const entry of runtime.entries) entries.set(keyOf(runtime, entry), { runtime, entry })
    if (!config.rankings[state.r]) state.r = 'cpu'
    fillPickers()
    showRankings()
    sidesBox.hidden = false
    render()
    if (!entries.has(state.b)) sides.b.select.focus()
  } catch {
    intro.textContent = 'The task\'s results could not be loaded. Reload the page to try again.'
  }
}
