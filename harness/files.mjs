// Fixture files for tasks that read or write the file system.
//
// A scenario declares them (`export const files = { tree, reset }`); this
// module creates them fresh in the task's scratch directory before every
// process that is measured, and removes them when it ends. It does not care
// what kind of task runs on them: a measuring script wraps each launch in
// `fixtures.around(...)`, and the runner of each kind honours the two
// environment variables below.
//
//   BENCH_FILES        the scratch directory, absolute. Set before the
//                      scenario is imported, so the scenario builds its case
//                      inputs from it; inherited by every adapter process.
//   BENCH_FILES_RESET  a JSON array of absolute paths under it. Set only when
//                      the scenario declares `reset`. A runner removes these
//                      before every operation, outside what it times.
//
// See "Tasks on the file system" in benchmarks/README.md.
import { execFileSync } from 'node:child_process'
import { chmodSync, existsSync, lutimesSync, mkdirSync, readFileSync, rmSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
// Under the repository, so every entry of every task works on the volume the
// repository is on. The system's temporary directory can be another kind of
// file system (tmpfs on Linux), which would be measured instead.
export const SCRATCH = path.join(REPO_ROOT, '.cache', 'scratch')
// Every file and directory gets this modification time unless it names one,
// so archives and copies that keep times are the same on every run.
export const FIXED_MTIME = Date.UTC(2026, 0, 1) / 1000

// The scratch directory of a task: one fixed path, the same for every adapter
// and runtime of the task, so path lengths and depth are equal for all.
export function filesRoot(taskId) {
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(taskId)) throw new Error(`not a task id: ${taskId}`)
  return path.join(SCRATCH, taskId)
}

// Call before importing the task's scenario.
export function announceFiles(taskId) {
  process.env.BENCH_FILES = filesRoot(taskId)
  delete process.env.BENCH_FILES_RESET
}

// A relative path that stays inside the scratch directory, in one spelling.
function inside(relative, what) {
  if (typeof relative !== 'string' || relative === '' || path.isAbsolute(relative) || relative.includes('\\') || relative.includes('\0')) throw new Error(`${what}: "${relative}" must be a relative path with forward slashes`)
  const parts = relative.replace(/\/$/, '').split('/')
  if (parts.some((part) => part === '' || part === '.' || part === '..')) throw new Error(`${what}: "${relative}" must not contain empty, "." or ".." parts`)
  return parts.join('/')
}

// Every absolute path found anywhere in the case inputs must be in the
// scratch directory: an adapter is never handed a path outside it.
function checkInputs(value, root, at) {
  if (typeof value === 'string') {
    if (path.isAbsolute(value) && value !== root && !value.startsWith(root + path.sep)) throw new Error(`${at}: "${value}" is outside the task's scratch directory`)
    if (value.startsWith(root) && value.split('/').includes('..')) throw new Error(`${at}: "${value}" must not contain ".."`)
  } else if (Array.isArray(value)) value.forEach((item, i) => checkInputs(item, root, `${at}[${i}]`))
  else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) checkInputs(item, root, `${at}.${key}`)
}

function validate(files, root) {
  if (!Array.isArray(files.tree)) throw new Error('scenario `files.tree` must be an array')
  const seen = new Map()
  const tree = files.tree.map((entry, i) => {
    const what = `files.tree[${i}]`
    const relative = inside(entry.path, what)
    const kind = entry.path.endsWith('/') ? 'directory' : entry.link !== undefined ? 'link' : 'file'
    if (seen.has(relative)) throw new Error(`${what}: "${relative}" is declared twice`)
    seen.set(relative, kind)
    if (kind === 'file' && typeof entry.content !== 'string' && !(entry.content instanceof Uint8Array)) throw new Error(`${what}: a file needs \`content\` (a string or a Uint8Array)`)
    if (kind === 'link') {
      // A link's target is relative to the link and must stay in the tree.
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), entry.link))
      if (typeof entry.link !== 'string' || path.isAbsolute(entry.link) || target === '..' || target.startsWith('../')) throw new Error(`${what}: link target "${entry.link}" leaves the scratch directory`)
    }
    if (entry.mode !== undefined && (!Number.isInteger(entry.mode) || entry.mode < 0 || entry.mode > 0o777)) throw new Error(`${what}: mode must be an integer such as 0o755`)
    return { ...entry, path: relative, kind }
  })
  for (const [relative] of seen) {
    for (let parent = path.posix.dirname(relative); parent !== '.'; parent = path.posix.dirname(parent)) {
      if (seen.has(parent) && seen.get(parent) !== 'directory') throw new Error(`files.tree: "${parent}" is both a file and a directory`)
    }
  }
  const reset = (files.reset ?? []).map((relative, i) => inside(relative, `files.reset[${i}]`))
  for (const relative of reset) {
    if ([...seen.keys()].some((declared) => declared === relative || declared.startsWith(relative + '/') || relative.startsWith(declared + '/') && seen.get(declared) !== 'directory')) throw new Error(`files.reset: "${relative}" overlaps the declared tree; what an operation writes must be apart from what the harness creates`)
  }
  return { tree, reset: reset.map((relative) => path.join(root, relative)) }
}

function create(root, tree) {
  mkdirSync(root, { recursive: true })
  const directories = new Set()
  const directory = (relative) => {
    for (let dir = relative; dir !== '.' && !directories.has(dir); dir = path.posix.dirname(dir)) directories.add(dir)
    mkdirSync(path.join(root, relative), { recursive: true })
  }
  let bytes = 0, count = 0
  for (const entry of tree) {
    const target = path.join(root, entry.path)
    if (entry.kind === 'directory') { directory(entry.path); continue }
    if (path.posix.dirname(entry.path) !== '.') directory(path.posix.dirname(entry.path))
    if (entry.kind === 'link') { symlinkSync(entry.link, target); lutimesSync(target, FIXED_MTIME, FIXED_MTIME); continue }
    writeFileSync(target, entry.content)
    if (entry.mode !== undefined) chmodSync(target, entry.mode)
    utimesSync(target, entry.mtime ?? FIXED_MTIME, entry.mtime ?? FIXED_MTIME)
    bytes += Buffer.byteLength(entry.content)
    count++
  }
  const modes = new Map(tree.filter((entry) => entry.kind === 'directory' && entry.mode !== undefined).map((entry) => [entry.path, entry.mode]))
  // Deepest first: creating a child changes its parent's time.
  for (const dir of [...directories].sort((a, b) => b.length - a.length)) {
    if (modes.has(dir)) chmodSync(path.join(root, dir), modes.get(dir))
    utimesSync(path.join(root, dir), FIXED_MTIME, FIXED_MTIME)
  }
  utimesSync(root, FIXED_MTIME, FIXED_MTIME)
  return { files: count, directories: directories.size, bytes }
}

// Only ever a directory under SCRATCH.
function remove(root) {
  if (!root.startsWith(SCRATCH + path.sep)) throw new Error(`refusing to remove ${root}`)
  rmSync(root, { recursive: true, force: true, maxRetries: 3 })
}

const alive = (pid) => { try { process.kill(pid, 0); return true } catch (error) { return error.code === 'EPERM' } }

// The kind of file system the scratch directory is on ("apfs", "ext2/ext3").
function fileSystemOf(dir) {
  try {
    if (process.platform !== 'darwin') return execFileSync('stat', ['-f', '-c', '%T', dir], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
    // macOS: the mount whose point is the longest prefix of the directory.
    const mounts = [...execFileSync('mount', { encoding: 'utf8' }).matchAll(/ on (.+) \(([a-z0-9]+)[,)]/g)].map(([, point, type]) => ({ point, type }))
    return mounts.filter(({ point }) => dir === point || dir.startsWith(point === '/' ? '/' : point + '/')).sort((x, y) => y.point.length - x.point.length)[0]?.type ?? null
  } catch { return null }
}

// The fixture files of a task, from its scenario module. Call after the
// scenario was imported (with `announceFiles` before the import). The result's
// `around(run)` creates the files, awaits `run()`, and removes them, whatever
// happens; wrap every launch of an adapter process in it. For a scenario
// without `files`, `around` only runs its argument.
export function fixtureFiles(taskId, scenario) {
  const root = filesRoot(taskId)
  if (!scenario.files) {
    delete process.env.BENCH_FILES
    delete process.env.BENCH_FILES_RESET
    return { root: null, declared: false, around: (run) => run() }
  }
  const { tree, reset } = validate(scenario.files, root)
  checkInputs((scenario.cases ?? []).map((c) => c.input), root, 'cases')
  process.env.BENCH_FILES = root
  if (reset.length) process.env.BENCH_FILES_RESET = JSON.stringify(reset)
  const lock = `${root}.lock`
  let held = false, said = false
  const release = () => {
    if (!held) return
    held = false
    try { remove(root) } catch {}
    rmSync(lock, { force: true })
  }
  // A measurement that is interrupted still leaves nothing behind.
  process.once('exit', release)
  return {
    root,
    declared: true,
    reset,
    async around(run) {
      mkdirSync(path.dirname(root), { recursive: true })
      try {
        writeFileSync(lock, String(process.pid), { flag: 'wx' })
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        const owner = Number(readFileSync(lock, 'utf8'))
        if (owner !== process.pid && alive(owner)) throw new Error(`the scratch directory of ${taskId} is in use by process ${owner}; one measurement of a task at a time`)
        writeFileSync(lock, String(process.pid))
      }
      held = true
      try {
        remove(root)
        const made = create(root, tree)
        if (!said) console.error(`files: ${made.files} files (${(made.bytes / 2 ** 20).toFixed(1)} MB) in ${made.directories} directories under ${path.relative(REPO_ROOT, root)}${fileSystemOf(root) ? `, on ${fileSystemOf(root)}` : ''}; created anew for each process`)
        said = true
        return await run()
      } finally {
        release()
      }
    },
  }
}

// For tests and tools: whether a task's scratch directory exists right now.
export const filesExist = (taskId) => existsSync(filesRoot(taskId))
