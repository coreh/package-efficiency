// The compare page: two results of one task side by side, their labels and
// their figures. The address holds the choice (?t=task&r=ranking&a=…&b=…,
// where a side is runtime:entry), so a comparison can be shared.
import { toDisplay } from './units.mjs'

const config = JSON.parse(document.getElementById('cmp-config').textContent)
const intro = document.getElementById('cmp-task')
const rankingBar = document.getElementById('cmp-rankings')
const sidesBox = document.getElementById('cmp-sides')
const figures = document.getElementById('cmp-figures')
const linkRow = document.getElementById('cmp-link-row')
const sides = Object.fromEntries([...document.querySelectorAll('.cmp-side')].map((el) => [el.dataset.side, { el, select: el.querySelector('select'), label: el.querySelector('.cmp-label') }]))

const params = new URLSearchParams(location.search)
const state = { t: params.get('t') ?? '', r: params.get('r') ?? 'cpu', a: params.get('a') ?? '', b: params.get('b') ?? '' }
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

function remember() {
  const next = new URLSearchParams()
  for (const name of ['t', 'r', 'a', 'b']) if (state[name] && !(name === 'r' && state.r === 'cpu')) next.set(name, state[name])
  history.replaceState(null, '', `?${next}`)
}

// What each row of the table shows: a title and the figure of an entry.
function rows() {
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
  if (!entry.grades?.[state.r]?.class && !entry.grades?.[state.r]?.reference) box.append(el('p', `No ${config.rankings[state.r].title.toLowerCase()} label for this result.`, 'cmp-empty'))
  else {
    const response = await fetch(labelUrl(runtime, entry, state.r))
    if (entries.get(state[side]) !== picked) return
    if (response.ok) box.innerHTML = await response.text()
    else box.append(el('p', 'The label could not be loaded.', 'cmp-empty'))
  }
  const open = el('a', 'Open this result', 'cmp-open')
  open.href = resultUrl(runtime, entry)
  box.append(open)
}

function showTable() {
  const a = entries.get(state.a)
  const b = entries.get(state.b)
  figures.hidden = !a && !b
  linkRow.hidden = !(a && b)
  const name = (picked) => (picked ? `${picked.entry.title} on ${picked.runtime.title}` : '')
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
    const ratio = kind !== 'class' && x > 0 && y != null ? `${number(y / x)}×` : ''
    tr.append(el('td', ratio, 'cmp-ratio'))
    if (kind !== 'class' && x != null && y != null && x !== y) tr.cells[x < y ? 1 : 2].classList.add('cmp-less')
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
if (task) {
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
