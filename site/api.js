// The API page (site/api.mjs). Everything it shows is already in the page as
// HTML: this script shows one format and one language at a time, fills the
// address from what is typed in the try box, sends it when asked, and copies.
// Without it the page shows every format and language, and no try box.

const entries = [...document.querySelectorAll('.api-entry')]
// A choice is kept for the next visit when the browser allows it.
const kept = {
  get: (key) => { try { return localStorage.getItem(key) } catch { return null } },
  set: (key, value) => { try { localStorage.setItem(key, value) } catch {} },
}
const shownIn = (entry, selector) => entry.querySelector(`${selector}.api-on`)
// The parts of one address beside its description: the try box, the examples, the answer.
const requestOf = (variant) => variant.closest('.api-entry').querySelector(`.api-request[data-format="${variant.dataset.format}"]`)
const formOf = (variant) => requestOf(variant).querySelector('.api-try')

// --- One format at a time, the same one in every entry that has it

function showFormat(entry, format) {
  const variants = [...entry.querySelectorAll('.api-variant')]
  if (!variants.some((variant) => variant.dataset.format === format)) return
  for (const part of entry.querySelectorAll('.api-variant, .api-request')) part.classList.toggle('api-on', part.dataset.format === format)
  for (const fields of entry.querySelectorAll('.api-fields-of')) fields.hidden = !fields.dataset.formats.split(' ').includes(format)
  const select = entry.querySelector('.api-choose select')
  if (select) select.value = format
}
const showFormatEverywhere = (format) => { for (const entry of entries) showFormat(entry, format) }

// --- One language at a time, everywhere

function showLanguage(language) {
  if (!document.querySelector(`.api-code[data-language="${language}"]`)) return
  for (const code of document.querySelectorAll('.api-code')) code.classList.toggle('api-on', code.dataset.language === language)
  for (const tab of document.querySelectorAll('.api-tabs button')) tab.setAttribute('aria-pressed', String(tab.dataset.language === language))
}

// --- The address of a variant, from its path and what is typed in its try box

// A name keeps its slashes and its @: they are parts of the address.
const segment = (value) => encodeURI(value.trim())
function addressOf(variant) {
  const form = formOf(variant)
  return variant.dataset.path.replace(/\{(\w+)\}/g, (_, name) => segment(form.elements[name]?.value ?? ''))
}
// Writes the address into the path on show, the examples and the copy button.
function fill(variant) {
  const form = formOf(variant)
  for (const part of variant.querySelectorAll('.api-path .api-param')) {
    const typed = form.elements[part.dataset.name]?.value.trim()
    part.textContent = typed || `{${part.dataset.name}}`
    part.classList.toggle('api-filled', Boolean(typed))
  }
  const before = variant.dataset.address
  const after = variant.dataset.site + addressOf(variant)
  if (before === after) return
  variant.dataset.address = after
  const request = requestOf(variant)
  // The address is a part of its own in each example, so the highlighting around it stays.
  for (const url of request.querySelectorAll('.api-url')) url.textContent = after
}

// --- Sending, and showing what came back

const SHOWN_LINES = 40
const MOST_LINES = 2000
const sizeText = (bytes) => (bytes < 1000 ? `${bytes} B` : bytes < 1e6 ? `${(bytes / 1000).toFixed(1)} kB` : `${(bytes / 1e6).toFixed(1)} MB`)
const element = (name, className, text) => {
  const made = document.createElement(name)
  if (className) made.className = className
  if (text !== undefined) made.textContent = text
  return made
}
// JSON is set out on lines; a very large file is shown as it came.
function readable(text, type) {
  if (!type.includes('json') || text.length > 2e6) return text
  try { return JSON.stringify(JSON.parse(text), null, 2) } catch { return text }
}
// JSON in the colours of the site's highlighted code (the .hljs-* classes of
// styles.css), made of text nodes and spans: nothing that came back is read as HTML.
const JSON_PART = /("(?:\\.|[^"\\])*")(?=(\s*:)?)|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g
function paint(code, text, json) {
  if (!json) { code.textContent = text; return }
  const parts = []
  let at = 0
  for (const match of text.matchAll(JSON_PART)) {
    if (match.index > at) parts.push(text.slice(at, match.index))
    const kind = match[1] ? (match[2] !== undefined ? 'attr' : 'string') : /^[{}\[\],:]$/.test(match[0]) ? 'punctuation' : /^[tfn]/.test(match[0]) ? 'literal' : 'number'
    parts.push(element('span', `hljs-${kind}`, match[0]))
    at = match.index + match[0].length
  }
  parts.push(text.slice(at))
  code.replaceChildren(...parts)
}
// The body in a box, cut to its first lines, with a button for the rest.
function bodyBox(text, json) {
  const lines = text.split('\n')
  const box = element('pre', 'api-sample')
  box.tabIndex = 0
  const code = box.appendChild(element('code'))
  paint(code, lines.slice(0, SHOWN_LINES).join('\n'), json)
  if (lines.length <= SHOWN_LINES) return [box]
  const most = Math.min(lines.length, MOST_LINES)
  const more = element('button', 'api-more', lines.length > MOST_LINES ? `Show the first ${most.toLocaleString('en-US')} of ${lines.length.toLocaleString('en-US')} lines` : `Show all ${lines.length.toLocaleString('en-US')} lines`)
  more.type = 'button'
  more.addEventListener('click', () => { paint(code, lines.slice(0, most).join('\n'), json); more.remove() })
  return [box, more]
}
async function send(variant) {
  const result = requestOf(variant).querySelector('.api-result')
  const path = addressOf(variant)
  const head = element('div', 'api-box-head')
  head.append(element('span', 'api-box-title', 'Response'), element('code', 'api-asked', path))
  result.replaceChildren(head, element('p', 'api-status soft', 'Waiting for the answer.'))
  result.hidden = false
  const started = performance.now()
  try {
    // The page and the files share an origin, so the address is asked of this site.
    const response = await fetch(location.origin + path)
    const blob = await response.blob()
    const took = Math.round(performance.now() - started)
    const type = response.headers.get('content-type') ?? blob.type ?? ''
    const status = element('p', 'api-status')
    status.append(element('b', response.ok ? '' : 'api-failed', `${response.status} ${response.statusText}`.trim()), ` · ${type || 'no content type'} · ${sizeText(blob.size)} · ${took} ms`)
    const parts = [head, status]
    if (response.redirected) parts.push(element('p', 'api-status soft', `Redirected to ${new URL(response.url).pathname}`))
    if (!response.ok) parts.push(element('p', 'api-status', response.status === 404 ? 'There is no file at this address. The body is the site\'s "not found" page.' : 'The request failed.'))
    if (response.ok && type.includes('svg')) {
      const image = element('img', 'api-figure')
      image.alt = 'The image that came back'
      image.src = URL.createObjectURL(blob)
      parts.push(image)
    }
    if (response.ok) parts.push(...bodyBox(readable(await blob.text(), type), type.includes('json')))
    result.replaceChildren(...parts)
  } catch (error) {
    result.replaceChildren(head, element('p', 'api-status', `No answer: ${error.message}`))
  }
}

// --- Copying

async function copy(button, text) {
  const label = button.textContent
  try { await navigator.clipboard.writeText(text); button.textContent = 'Copied' } catch { button.textContent = 'Not copied' }
  setTimeout(() => { button.textContent = label }, 1500)
}
const copies = {
  markdown: (entry) => entry.querySelector('.api-markdown').content.textContent,
  address: (entry) => shownIn(entry, '.api-variant').dataset.address,
}

// --- Setting up

for (const entry of entries) {
  showFormat(entry, entry.querySelector('.api-variant').dataset.format)
  entry.classList.add('api-live')
  entry.querySelector('.api-bar').hidden = false
  const select = entry.querySelector('.api-choose select')
  if (select) select.addEventListener('change', () => {
    // Entries above this one change height: keep the select where it is.
    const before = select.getBoundingClientRect().top
    showFormatEverywhere(select.value)
    scrollBy(0, select.getBoundingClientRect().top - before)
    kept.set('api-format', select.value)
  })
  for (const variant of entry.querySelectorAll('.api-variant')) {
    const form = formOf(variant)
    form.hidden = false
    form.addEventListener('input', () => fill(variant))
    form.addEventListener('submit', (event) => { event.preventDefault(); fill(variant); send(variant) })
  }
  for (const tabs of entry.querySelectorAll('.api-tabs')) tabs.hidden = false
  for (const button of entry.querySelectorAll('.api-actions button, .api-try [data-copy], .api-copy')) {
    if (!navigator.clipboard) continue
    button.hidden = false
    button.addEventListener('click', () => copy(button, button.dataset.copy ? copies[button.dataset.copy](entry) : button.closest('.api-box').querySelector('.api-code.api-on code').textContent))
  }
}
document.addEventListener('click', (event) => {
  const tab = event.target.closest('.api-tabs button')
  if (!tab) return
  // Boxes above this one can change height: keep the tab where it is.
  const before = tab.getBoundingClientRect().top
  showLanguage(tab.dataset.language)
  scrollBy(0, tab.getBoundingClientRect().top - before)
  kept.set('api-language', tab.dataset.language)
})
showLanguage('curl')
if (kept.get('api-format')) showFormatEverywhere(kept.get('api-format'))
if (kept.get('api-language')) showLanguage(kept.get('api-language'))

// A link to one address of an entry shows that address; one to a list of fields opens it.
function follow() {
  let target = null
  try { target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null } catch {}
  if (target?.matches('details')) target.open = true
  const variant = target?.closest('.api-variant')
  if (!variant) return
  showFormat(variant.closest('.api-entry'), variant.dataset.format)
  variant.closest('.api-entry').scrollIntoView()
}
addEventListener('hashchange', follow)
follow()
