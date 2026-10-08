// The advanced search page: the whole index is one file, filtered in the
// browser. The form's state lives in the address, so a search can be shared
// and the back button returns to the one before.
const form = document.getElementById('adv-form')
const count = document.getElementById('adv-count')
const table = document.getElementById('adv-results')
const body = table.tBodies[0]
const more = document.getElementById('adv-more')
const config = JSON.parse(document.getElementById('adv-config').textContent)
const PAGE = 100
const MULTI = ['lang', 'reg', 'rt']
const SINGLE = ['q', 'in', 'cpu', 'memory', 'types', 'lic', 'from', 'to', 'sort']
let index = []
let found = []
let shown = 0

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
  const query = params.toString()
  history.replaceState(null, '', query ? `?${query}` : location.pathname)
}

// How well an item answers the words: 0 the title itself, then a title that
// starts with them, a word of the title that does, the title anywhere, another
// name, and last the description. null when a word is nowhere.
function score(item, words, whole) {
  if (!words.length) return 3
  const title = item.t.toLowerCase()
  const names = (item.a ?? []).join(' ').toLowerCase()
  const text = (item.d ?? '').toLowerCase()
  let worst = 0
  for (const word of words) {
    const at = title.indexOf(word)
    const rank = at === 0 ? 1 : at > 0 && /[^a-z0-9]/.test(title[at - 1]) ? 2 : at > 0 ? 3 : names.includes(word) ? 4 : text.includes(word) ? 5 : null
    if (rank === null) return null
    worst = Math.max(worst, rank)
  }
  return title === whole ? 0 : worst
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
    if ((s.from && !(item.f >= s.from)) || (s.to && !(item.f <= s.to))) continue
    const rank = score(item, words, whole)
    if (rank !== null) found.push({ item, rank })
  }
  const used = (a, b) => (a.item.r ?? 1e9) - (b.item.r ?? 1e9)
  const byName = (a, b) => a.item.t.localeCompare(b.item.t)
  const order = {
    '': (a, b) => a.rank - b.rank || (b.item.m ?? 0) - (a.item.m ?? 0) || used(a, b) || byName(a, b),
    used: (a, b) => used(a, b) || byName(a, b),
    name: byName,
    new: (a, b) => (b.item.f ?? '').localeCompare(a.item.f ?? '') || byName(a, b),
    old: (a, b) => (a.item.f ?? '9').localeCompare(b.item.f ?? '9') || byName(a, b),
  }
  found.sort(order[s.sort] ?? order[''])
  body.replaceChildren()
  shown = 0
  show()
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

function row({ item }) {
  const tr = document.createElement('tr')
  const name = el('td', null, 'l wrap')
  const link = el('a', item.t)
  link.href = item.u
  name.append(link)
  if (item.d) name.append(el('small', item.d, 'adv-desc'))
  const kind = el('td', item.y === 'p' ? `${config.registries[item.e] ?? 'Package'}${item.m ? '' : ', not measured'}` : `${config.kinds[item.y]}${item.m || item.y === 'e' ? '' : ', not measured'}`, 'l')
  const classes = el('td', null, 'l adv-classes')
  for (const [id, measure] of Object.entries(config.measures)) {
    const letter = item.k?.[id]
    if (!letter) continue
    const color = measure.colors['ABCDEFG'.indexOf(letter)]
    const chip = el('span', letter, 'cls')
    chip.style.background = color
    chip.style.color = ink(color)
    const pair = el('span', `${measure.title} `, 'adv-class')
    pair.append(chip)
    classes.append(pair)
  }
  tr.append(name, kind, el('td', item.c ?? '', 'l wrap'), classes, el('td', item.l ?? '', 'l'), el('td', item.f ?? '', 'l'))
  return tr
}

function show() {
  const next = found.slice(shown, shown + PAGE)
  body.append(...next.map(row))
  shown += next.length
  table.hidden = !found.length
  more.hidden = shown >= found.length
  count.textContent = found.length ? `${found.length.toLocaleString('en-US')} ${found.length === 1 ? 'result' : 'results'}${shown < found.length ? `, the first ${shown.toLocaleString('en-US')} shown` : ''}.` : 'Nothing matches. Remove a filter or use fewer words.'
}

let timer
const soon = () => { clearTimeout(timer); timer = setTimeout(search, 120) }
form.addEventListener('input', soon)
form.addEventListener('change', search)
form.addEventListener('submit', (event) => { event.preventDefault(); search() })
form.addEventListener('reset', () => setTimeout(() => { for (const box of form.querySelectorAll('input[type="checkbox"]')) box.checked = false; search() }))
more.addEventListener('click', show)
addEventListener('popstate', () => { restore(); search() })

restore()
try {
  index = await fetch('/search-full.json').then((r) => r.json())
  search()
} catch {
  count.textContent = 'The search index could not be loaded. Reload the page to try again.'
}
