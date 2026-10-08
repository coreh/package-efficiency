// Benchmark source code for the site: which files belong to a task or an
// adapter, and their syntax-highlighted HTML. Highlighting happens at build
// time, so the pages need no script.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import hljs from 'highlight.js/lib/common'

const ROOT = new URL('..', import.meta.url).pathname
const LANGUAGES = { js: 'javascript', mjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', py: 'python', rb: 'ruby', ru: 'ruby', go: 'go', rs: 'rust', toml: 'ini', md: 'markdown', mod: 'go', html: 'xml', erb: 'xml', svg: 'xml', css: 'css', yml: 'yaml', yaml: 'yaml' }
// Files of a shared application that are not worth reading: locks with
// checksums, placeholders, and anything that is not text.
const APP_SKIP = /(^|\/)(gems\.lock\.json|Gemfile\.lock|lock\.json|\.keep|.*\.(png|ico|jpg|gif|woff2?|sum|lock))$/
// Generated or installed files: checksums, lockfiles, dependencies, build output.
const SKIP = new Set(['node_modules', 'target', '.DS_Store', 'go.sum', 'Cargo.lock', 'package-lock.json', '__pycache__'])
// What a reader wants first: the code, then its settings.
const ORDER = ['task.md', 'task.json', 'scenario.mjs', 'prepare.mjs', 'adapter.js', 'adapter.mjs', 'adapter.ts', 'adapter.py', 'adapter.rb', 'adapter.go', 'src/main.rs', 'runner.go', 'adapter.json', 'package.json', 'Cargo.toml', 'go.mod']

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Code as highlighted HTML, in the classes that styles.css colours (.hljs-*).
// `language` is a highlight.js name (javascript, python, ruby, go, rust, bash,
// json, markdown and so on); without one the text is only escaped. `lenient`
// is for text that is not quite the language, such as JSON that has been cut
// short: what does not fit is left plain.
export const highlighted = (text, language, { lenient = false } = {}) => (language ? hljs.highlight(text, { language, ignoreIllegals: lenient }).value : escape(text))

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
    html: highlighted(text, language),
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

// The task whose folders hold the adapters of a task: itself, or the task it
// borrows them from (task.json `adaptersFrom`, as a lenient task does with
// the adapters of its strict task).
export const adaptersTaskOf = (taskId) => JSON.parse(readFileSync(path.join(ROOT, 'benchmarks', taskId, 'task.json'), 'utf8')).adaptersFrom ?? taskId

// One adapter's files. A variant has only settings of its own and runs the
// code of the adapter it is a variant of; `shared` holds that adapter's files.
// The files are shown from where they are: for a task that borrows its
// adapters that is the other task's folder.
export function adapterSource(taskId, adapterId) {
  const adaptersTask = adaptersTaskOf(taskId)
  const dir = `benchmarks/${adaptersTask}/${adapterId}`
  const files = sorted(walk(dir).map((file) => load(file, dir)))
  const { variantOf, app } = JSON.parse(readFileSync(path.join(ROOT, dir, 'adapter.json'), 'utf8'))
  // An entry that runs a shared application (adapter.json `app`) has only a
  // record of its own; `app` holds the application's files.
  const appDir = app ? path.posix.normalize(`${dir}/${app}`) : null
  const appFiles = appDir ? { dir: appDir, files: sorted(walk(appDir).filter((file) => !APP_SKIP.test(file)).map((file) => load(file, appDir))) } : null
  if (!variantOf) return { dir, files, variantOf: null, shared: [], app: appFiles }
  const siblingId = `${adapterId.slice(0, adapterId.lastIndexOf('/'))}/${variantOf}`
  const sibling = `benchmarks/${adaptersTask}/${siblingId}`
  return { dir, files, variantOf: siblingId, shared: sorted(walk(sibling).map((file) => load(file, sibling))).filter((f) => f.name !== 'adapter.json'), app: appFiles }
}

// The adapter folder an entry was measured from. Entries for an earlier
// version carry the version after an @ and share the adapter.
export const adapterIdOf = (entry) => entry.id.replace(/(?<=[^/])@[^/@]+$/, '')
