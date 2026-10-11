// The advanced search page: the whole index is one file, filtered in the
// browser. The form's state lives in the address, so a search can be shared
// and the back button returns to the one before.
const form = document.getElementById('adv-form')
const count = document.getElementById('adv-count')
const table = document.getElementById('adv-results')
const body = table.tBodies[0]
const config = JSON.parse(document.getElementById('adv-config').textContent)
const PAGE_SIZE = 30
const MULTI = ['lang', 'reg', 'rt', 'kind']
const SINGLE = ['q', 'in', 'cpu', 'memory', 'types', 'lic', 'from', 'to']
let index = []
let found = []
let page = 0
let all = false
// The column the results are sorted by, as the site's other tables do it: a
// click on a heading sorts by it, a second click turns the direction. In the
// address as sort=name or sort=-released (largest first).
const COLUMNS = [...table.tHead.rows[0].cells].map((th) => th.dataset.col)
const FIRST_DESCENDING = new Set(['relevance', 'released'])
let sort = { col: 'relevance', descending: true }
function parseSort(value) {
  const col = (value ?? '').replace(/^-/, '')
  return COLUMNS.includes(col) ? { col, descending: value.startsWith('-') } : { col: 'relevance', descending: true }
}

// Address to form.
function restore() {
  const params = new URLSearchParams(location.search)
  for (const name of SINGLE) {
    const field = form.elements[name]
    const value = params.get(name) ?? ''
    if (field instanceof RadioNodeList) field.value = value
    else field.value = value
  }
  for (const name of MULTI) {
    const wanted = new Set(params.getAll(name).flatMap((v) => v.split(',')))
    for (const box of form.querySelectorAll(`input[name="${name}"]`)) box.checked = wanted.has(box.value)
  }
  form.elements.measured.checked = params.get('measured') === '1'
  sort = parseSort(params.get('sort'))
}

function state() {
  const read = (name) => (form.elements[name].value ?? '').trim()
  const picked = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((box) => box.value)
  return { ...Object.fromEntries(SINGLE.map((name) => [name, read(name)])), ...Object.fromEntries(MULTI.map((name) => [name, picked(name)])), measured: form.elements.measured.checked }
}

function remember(s) {
  const params = new URLSearchParams()
  for (const name of SINGLE) if (s[name]) params.set(name, s[name])
  for (const name of MULTI) if (s[name].length) params.set(name, s[name].join(','))
  if (s.measured) params.set('measured', '1')
  if (sort.col !== 'relevance' || !sort.descending) params.set('sort', `${sort.descending ? '-' : ''}${sort.col}`)
  const query = params.toString()
  history.replaceState(null, '', query ? `?${query}` : location.pathname)
}

// How well an item answers the words, from 0 to 1 (null when a word is
// nowhere). Where each word is found sets the level: the start of the name,
// the start of a word in it, elsewhere in it, another name, the description.
// Within a level, a word that covers more of the name, and is found earlier,
// counts for more. The words' scores are averaged, the whole phrase found
// together adds a little, and the exact name is 1. Last, a nudge for measured
// and much-used packages, so that near-ties fall the way a reader expects.
const isBoundary = (text, at) => at === 0 || /[^a-z0-9]/.test(text[at - 1])
function wordScore(word, title, names, text) {
  const at = title.indexOf(word)
  if (at !== -1) {
    const cover = word.length / title.length
    const early = 1 - at / title.length
    const base = at === 0 ? 0.72 : isBoundary(title, at) ? 0.58 : 0.46
    return base + 0.18 * cover + 0.05 * early
  }
  const alias = names.find((n) => n.includes(word))
  if (alias) return 0.36 + 0.08 * (word.length / alias.length)
  const found = text.indexOf(word)
  if (found !== -1) return 0.16 + (isBoundary(text, found) ? 0.06 : 0) + 0.06 * Math.max(0, 1 - found / 120)
  return null
}
function score(item, words, whole) {
  if (!words.length) return null
  const title = item.t.toLowerCase()
  if (title === whole) return 1
  const names = (item.a ?? []).map((n) => n.toLowerCase())
  const text = (item.d ?? '').toLowerCase()
  let sum = 0
  for (const word of words) {
    const s = wordScore(word, title, names, text)
    if (s === null) return null
    sum += s
  }
  let value = sum / words.length
  if (words.length > 1 && (title.includes(whole) || text.includes(whole))) value += 0.04
  const used = item.r ? Math.max(0, 1 - Math.log10(item.r) / 4) : 0
  value += 0.015 * (item.m ? 1 : 0) + 0.015 * used
  return Math.min(0.99, value)
}

function search() {
  const s = state()
  remember(s)
  const whole = s.q.toLowerCase()
  const words = whole.split(/\s+/).filter(Boolean)
  const license = s.lic.toLowerCase()
  const any = (wanted, have) => !wanted.length || (have ?? []).some((v) => wanted.includes(v))
  found = []
  for (const item of index) {
    if (s.in && item.y !== s.in) continue
    if (!any(s.lang, item.g) || !any(s.rt, item.rt)) continue
    if (s.reg.length && !s.reg.includes(item.e)) continue
    if (s.measured && !item.m) continue
    if (['cpu', 'memory', 'types'].some((id) => s[id] && !(item.k?.[id] <= s[id]))) continue
    if (license && !(item.l ?? '').toLowerCase().includes(license)) continue
    if (s.kind.length && !s.kind.includes(item.lk)) continue
    if ((s.from && !(item.f >= s.from)) || (s.to && !(item.f <= s.to))) continue
    const value = score(item, words, whole)
    if (value !== null || !words.length) found.push({ item, value, relevance: value === null ? null : Math.round(value * 100) })
  }
  arrange()
  page = 0
  show()
}

const collator = new Intl.Collator('en', { numeric: true })
const kindOf = (item) => (item.y === 'p' ? `${config.registries[item.e] ?? 'Package'}${item.m ? '' : ', not measured'}` : `${config.kinds[item.y]}${item.m || item.y === 'e' ? '' : ', not measured'}`)
// What each column sorts by; a missing value goes last either way.
const KEYS = {
  relevance: (r) => r.value,
  name: (r) => r.item.t,
  kind: (r) => kindOf(r.item),
  category: (r) => r.item.c,
  cpu: (r) => r.item.k?.cpu,
  memory: (r) => r.item.k?.memory,
  types: (r) => r.item.k?.types,
  license: (r) => r.item.l,
  released: (r) => r.item.f,
}
// Ties: measured first, then the most used, then by name.
const tie = (a, b) => (b.item.m ?? 0) - (a.item.m ?? 0) || (a.item.r ?? 1e9) - (b.item.r ?? 1e9) || collator.compare(a.item.t, b.item.t)

function arrange() {
  const key = KEYS[sort.col]
  const direction = sort.descending ? -1 : 1
  // Class letters sort A first: the best class reads as the smallest value.
  found.sort((a, b) => {
    const x = key(a), y = key(b)
    const absent = (v) => v == null || v === ''
    if (absent(x) || absent(y)) return Number(absent(x)) - Number(absent(y)) || tie(a, b)
    return direction * (typeof x === 'number' ? x - y : collator.compare(x, y)) || tie(a, b)
  })
  for (const th of table.tHead.rows[0].cells) {
    if (th.dataset.col === sort.col) th.setAttribute('aria-sort', sort.descending ? 'descending' : 'ascending')
    else th.removeAttribute('aria-sort')
  }
}

for (const th of table.tHead.rows[0].cells) {
  th.querySelector('button').addEventListener('click', () => {
    const col = th.dataset.col
    sort = col === sort.col ? { col, descending: !sort.descending } : { col, descending: FIRST_DESCENDING.has(col) }
    remember(state())
    arrange()
    page = 0
    show()
  })
}

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

// The score as a meter of ten squares, filled from the left; the exact score
// is its tooltip and what the column sorts by.
const SQUARES = 10
function meter(relevance) {
  const cell = el('td', null, 'adv-score')
  if (relevance == null) return cell
  const filled = Math.max(1, Math.round(relevance / 10))
  const bar = el('span', null, relevance > 80 ? 'adv-meter high' : 'adv-meter')
  bar.setAttribute('role', 'img')
  bar.setAttribute('aria-label', `Relevance ${relevance} of 100`)
  bar.title = `Relevance ${relevance} of 100`
  for (let i = 0; i < SQUARES; i++) bar.append(el('i', null, i < filled ? 'on' : null))
  cell.append(bar)
  return cell
}

function row({ item, relevance }) {
  const tr = document.createElement('tr')
  const name = el('td', null, 'l wrap')
  const link = el('a', item.t)
  link.href = item.u
  name.append(link)
  if (item.d) name.append(el('small', item.d, 'adv-desc'))
  const kind = el('td', kindOf(item), 'l')
  // One narrow column for each measure: its best class, or nothing.
  const classes = Object.entries(config.measures).map(([id, measure]) => {
    const cell = el('td', null, 'adv-class')
    const letter = item.k?.[id]
    if (letter) {
      const color = measure.colors['ABCDEFG'.indexOf(letter)]
      const chip = el('span', letter, 'cls')
      chip.style.background = color
      chip.style.color = ink(color)
      chip.title = `Best ${measure.title.toLowerCase()} class: ${letter}`
      cell.append(chip)
    }
    return cell
  })
  const license = el('td', item.l ?? '', 'l')
  if (item.lk) license.append(el('small', config.licenseKinds[item.lk], 'adv-desc'))
  tr.append(meter(relevance), name, kind, el('td', item.c ?? '', 'l wrap'), ...classes, license, el('td', item.f ?? '', 'l'))
  return tr
}

// The site's own pager (see app.js), above and below the results.
const head = document.querySelector('.adv-head')
const pagers = ['above', 'below'].map((place) => {
  const nav = el('nav', null, `pager ${place}`)
  nav.setAttribute('aria-label', `Result pages, ${place} the results`)
  const control = (text, action) => {
    const button = el('button', text)
    button.type = 'button'
    button.addEventListener('click', () => { action(); show(); if (place === 'below') head.scrollIntoView({ block: 'nearest' }) })
    nav.append(button)
    return button
  }
  const previous = control('Previous', () => page--)
  const status = el('span', null, 'status')
  nav.append(status)
  const next = control('Next', () => page++)
  const everything = control('', () => { all = !all; page = 0 })
  everything.className = 'all'
  return { nav, previous, status, next, everything }
})
head.classList.add('has-pager')
head.append(pagers[0].nav)
table.closest('.scroll').after(pagers[1].nav)

function show() {
  const total = found.length
  const pages = Math.ceil(total / PAGE_SIZE)
  page = Math.max(0, Math.min(page, pages - 1))
  const start = all ? 0 : page * PAGE_SIZE
  const end = all ? total : Math.min(start + PAGE_SIZE, total)
  body.replaceChildren(...found.slice(start, end).map(row))
  table.hidden = !total
  for (const pager of pagers) {
    pager.nav.hidden = total <= PAGE_SIZE
    pager.status.textContent = `${(start + 1).toLocaleString('en-US')}–${end.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`
    pager.previous.disabled = all || page === 0
    pager.next.disabled = all || page >= pages - 1
    pager.everything.textContent = all ? `Show ${PAGE_SIZE} at a time` : 'Show all'
  }
  count.textContent = total ? `${total.toLocaleString('en-US')} ${total === 1 ? 'result' : 'results'}` : 'Nothing matches. Remove a filter or use fewer words.'
}

let timer
const soon = () => { clearTimeout(timer); timer = setTimeout(search, 120) }
form.addEventListener('input', soon)
form.addEventListener('change', search)
form.addEventListener('submit', (event) => { event.preventDefault(); search() })
form.addEventListener('reset', () => setTimeout(() => { for (const box of form.querySelectorAll('input[type="checkbox"]')) box.checked = false; search() }))
addEventListener('popstate', () => { restore(); search() })

restore()
try {
  index = await fetch('/search-full.json').then((r) => r.json())
  search()
} catch {
  count.textContent = 'The search index could not be loaded. Reload the page to try again.'
}
