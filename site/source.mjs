// Benchmark source code for the site: which files belong to a task or an
// adapter, and their syntax-highlighted HTML. Highlighting happens at build
// time, so the pages need no script.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import hljs from 'highlight.js/lib/common'

const ROOT = new URL('..', import.meta.url).pathname
const LANGUAGES = { js: 'javascript', mjs: 'javascript', ts: 'typescript', json: 'json', py: 'python', rb: 'ruby', go: 'go', rs: 'rust', toml: 'ini', md: 'markdown', mod: 'go' }
// Generated or installed files: checksums, lockfiles, dependencies, build output.
const SKIP = new Set(['node_modules', 'target', '.DS_Store', 'go.sum', 'Cargo.lock', 'package-lock.json', '__pycache__'])
// What a reader wants first: the code, then its settings.
const ORDER = ['task.md', 'task.json', 'scenario.mjs', 'adapter.js', 'adapter.mjs', 'adapter.ts', 'adapter.py', 'adapter.rb', 'adapter.go', 'src/main.rs', 'runner.go', 'adapter.json', 'package.json', 'Cargo.toml', 'go.mod']

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Files under `dir` (relative to the repository root), as repository paths.
function walk(dir, { deep = true } = {}) {
  return readdirSync(path.join(ROOT, dir))
    .filter((name) => !SKIP.has(name))
    .flatMap((name) => {
      const file = `${dir}/${name}`
      if (!statSync(path.join(ROOT, file)).isDirectory()) return [file]
      return deep ? walk(file) : []
    })
}

function load(file, base) {
  const text = readFileSync(path.join(ROOT, file), 'utf8').replace(/\n+$/, '')
  const language = LANGUAGES[path.extname(file).slice(1)]
  const name = file.slice(base.length + 1)
  return {
    path: file,
    name,
    lines: text.split('\n').length,
    // The plain text and its language, for the Markdown version of a page.
    text,
    language: language ?? '',
    html: language ? hljs.highlight(text, { language }).value : escape(text),
  }
}

const sorted = (files) =>
  files.sort((a, b) => {
    const rank = (f) => (ORDER.indexOf(f.name) + 1 || ORDER.length + 1)
    return rank(a) - rank(b) || a.name.localeCompare(b.name)
  })

// A task's own files: its description, settings and the scenario every
// adapter is run against. Adapter folders are not included.
export const taskSource = (taskId) => sorted(walk(`benchmarks/${taskId}`, { deep: false }).map((file) => load(file, `benchmarks/${taskId}`)))

// One adapter's files. A variant has only settings of its own and runs the
// code of the adapter it is a variant of; `shared` holds that adapter's files.
export function adapterSource(taskId, adapterId) {
  const dir = `benchmarks/${taskId}/${adapterId}`
  const files = sorted(walk(dir).map((file) => load(file, dir)))
  const { variantOf } = JSON.parse(readFileSync(path.join(ROOT, dir, 'adapter.json'), 'utf8'))
  if (!variantOf) return { dir, files, variantOf: null, shared: [] }
  const siblingId = `${adapterId.slice(0, adapterId.lastIndexOf('/'))}/${variantOf}`
  const sibling = `benchmarks/${taskId}/${siblingId}`
  return { dir, files, variantOf: siblingId, shared: sorted(walk(sibling).map((file) => load(file, sibling))).filter((f) => f.name !== 'adapter.json') }
}

// The adapter folder an entry was measured from. Entries for an earlier
// version carry the version after an @ and share the adapter.
export const adapterIdOf = (entry) => entry.id.replace(/(?<=[^/])@[^/@]+$/, '')
