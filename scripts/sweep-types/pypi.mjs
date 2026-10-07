// Type-check cost of PyPI packages, the counterpart of scripts/measure-types.mjs:
// how much mypy's CPU time and peak memory grow when a program that only
// imports the package is checked, over an empty program. Writes
// data/pypi/types.json.
//
// Usage: node scripts/sweep-types/pypi.mjs <pkg>... | --top=N
//        [--force] [--retry-failed] [--runs=11] [--keep] [--infer-untyped] [--out=file]
// --top=N takes the N most used of data/pypi/packages.json and everything in
// data/pypi/picked.json. A run can be stopped and started again: the results
// file is written after every package, packages already in it are skipped
// (--retry-failed tries the ones that are not `ok` again, --force everything),
// and Ctrl-C finishes the package in hand.
// --infer-untyped also records, beside an `untyped` status and never as the
// figure, what mypy costs when made to read the unannotated source.
// --keep leaves the scratch install in .cache/sweep-types/pypi/.
//
// Generated program: entry.py with one `import <module>` per public import
// name of the distribution, the plain top-level import, as the npm check does.
// The names come from the wheel's RECORD: top-level modules, packages, and the
// first real packages inside namespace directories (google.cloud.storage).
//
// Command, one fresh process per run:
//   mypy --strict --no-incremental --cache-dir=/dev/null --python-version 3.12
//        --python-executable <venv>/bin/python entry.py
// The package is alone in its own venv, and --python-executable makes mypy
// apply PEP 561: only a py.typed marker or a stub distribution counts as typed.
//
// Baseline: `pass` checked against an empty venv. Figure (`added`): median of
// the runs minus the baseline median, process CPU (user + system) and peak RSS.
//
// Classification:
//   ok             mypy accepts the imports
//   untyped        mypy reports import-untyped and no stub distribution helps:
//                  the one mypy names in its hint, types-<name>, <name>-stubs.
//                  No figure, as for any package without types.
// Types that do not come from the package's own project are used and marked:
// `communityTypes: true` on the entry, with `stubsPublisher` saying whose they
// are: "typeshed", "third-party", or "same-project" (published from the
// package's own source-hosting account, like pandas-stubs; not community).
//   no-entry       nothing importable in RECORD, or mypy cannot find the module
//   install-failed no wheels resolvable inside the release-age window
//   check-failed   any other failure of mypy
//
// Safety: wheels only (installing a wheel runs no package code), nothing
// uploaded less than 7 days ago anywhere in the dependency closure. pip
// resolves with --only-binary=:all: and --uploaded-prior-to, without
// installing; every resolved file is then checked again against PyPI (upload
// time, not yanked, SHA-256); only then is exactly that closure installed with
// --no-deps --require-hashes. Stub distributions go the same way.
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CUTOFF, MIN_RELEASE_AGE_DAYS, args, duMb, exec, fetchJson, fromRoot, loadTargets, measure, oldEnough, readJson, round, spread, sweep, timed } from './lib.mjs'

const { names, value, has } = args('Usage: node scripts/sweep-types/pypi.mjs <pkg>... | --top=N [--force] [--retry-failed] [--runs=11] [--keep] [--infer-untyped] [--out=file]')
const RUNS = Number(value('runs', 11))
const WORK = fromRoot('.cache/sweep-types/pypi')
const OUT = value('out') ? path.resolve(value('out')) : fromRoot('data/pypi/types.json')
const PIP_CACHE = path.join(WORK, 'pip-cache')
const PYTHON = fromRoot('.cache/checkers/python/bin/python')
const lock = await readJson(fromRoot('toolchains/checkers.json'))
const TARGET_PYTHON = '3.12'
// Same strictness as the adapter checks. Errors inside installed packages are
// never reported by mypy, so the only errors seen are about entry.py's imports.
const MYPY = [PYTHON, '-m', 'mypy', '--strict', '--no-incremental', '--cache-dir=/dev/null', '--python-version', TARGET_PYTHON]
const cutoffIso = new Date(CUTOFF).toISOString().replace(/\.\d+Z$/, 'Z')

const { targets, listedVersion } = await loadTargets('pypi', names, Number(value('top', 0)))

const normalize = (name) => name.toLowerCase().replace(/[-_.]+/g, '-')
const pyVersion = (await exec(PYTHON, ['-c', 'import sys;print("%d.%d"%sys.version_info[:2])'])).stdout.trim()

async function makeVenv(dir) {
  await rm(dir, { recursive: true, force: true })
  await exec(PYTHON, ['-m', 'venv', '--without-pip', dir])
  return path.join(dir, 'lib', `python${pyVersion}`, 'site-packages')
}

const pypiMeta = new Map()
async function releaseFiles(name, version) {
  const key = `${normalize(name)}==${version}`
  if (!pypiMeta.has(key)) pypiMeta.set(key, fetchJson(`https://pypi.org/pypi/${normalize(name)}/${version}/json`))
  return (await pypiMeta.get(key)).urls
}

// The whole release must be old enough and not yanked, as setup-checkers.mjs requires.
async function eligible(name, version) {
  const files = await releaseFiles(name, version).catch(() => [])
  return files.length > 0 && files.every((f) => !f.yanked && oldEnough(f.upload_time_iso_8601))
}

// Whose a stub distribution is: typeshed's, the package's own project's
// (published from the same source-hosting account, pandas-dev/pandas-stubs for
// pandas), or a third party's. Only the second is not community types.
const projectUrls = new Map()
function urlsOf(name) {
  if (!projectUrls.has(name)) projectUrls.set(name, fetchJson(`https://pypi.org/pypi/${normalize(name)}/json`).then((d) => [d.info.home_page, ...Object.values(d.info.project_urls ?? {})].filter(Boolean), () => []))
  return projectUrls.get(name)
}
const owners = (urls) => new Set(urls.map((u) => /(?:github\.com|gitlab\.com|bitbucket\.org)\/([^/#?]+)/i.exec(u)?.[1]?.toLowerCase()).filter(Boolean))
async function stubsPublisher(stubs, pkg) {
  const stubUrls = await urlsOf(stubs)
  if (stubUrls.some((u) => /github\.com\/python\/typeshed/i.test(u))) return 'typeshed'
  const mine = owners(await urlsOf(pkg))
  return [...owners(stubUrls)].some((o) => mine.has(o)) ? 'same-project' : 'third-party'
}

const pip = (extra) => exec(PYTHON, ['-m', 'pip', 'install', '--disable-pip-version-check', '--quiet', '--cache-dir', PIP_CACHE, '--only-binary=:all:', ...extra], { maxBuffer: 64 << 20 })

// Resolve without installing, verify ages, then install the exact files.
async function install(site, requirement, dir, tag) {
  const report = path.join(dir, `${tag}-report.json`)
  // --ignore-installed: resolve from scratch, whatever is already in the venv.
  await pip(['--dry-run', '--ignore-installed', '--uploaded-prior-to', cutoffIso, '--target', site, '--report', report, requirement])
  const resolved = (await readJson(report)).install
  const lines = []
  for (const item of resolved) {
    const { name, version } = item.metadata
    const file = decodeURIComponent(item.download_info.url.split('/').pop().split('#')[0])
    const sha256 = item.download_info.archive_info?.hashes?.sha256
    if (!file.endsWith('.whl') || !sha256) throw new Error(`not a hashed wheel: ${file}`)
    const meta = (await releaseFiles(name, version)).find((f) => f.filename === file)
    if (!meta) throw new Error(`release-age gate: ${file} not listed by PyPI`)
    if (meta.yanked || !oldEnough(meta.upload_time_iso_8601) || meta.digests.sha256 !== sha256) throw new Error(`release-age gate rejected ${file} (uploaded ${meta.upload_time_iso_8601})`)
    lines.push(`${name}==${version} --hash=sha256:${sha256}`)
  }
  const requirements = path.join(dir, `${tag}-requirements.txt`)
  await writeFile(requirements, lines.join('\n') + '\n')
  await pip(['--no-deps', '--require-hashes', '--no-compile', '--upgrade', '--target', site, '-r', requirements])
  const requested = resolved.find((i) => i.requested) ?? resolved[0]
  return { version: requested.metadata.version, name: requested.metadata.name, closure: resolved.map((i) => `${i.metadata.name}==${i.metadata.version}`) }
}

// Import names from the wheel's RECORD: top-level modules, packages, and the
// first real packages inside namespace directories (google/cloud/storage).
const SKIP = new Set(['tests', 'test', 'testing', 'docs', 'doc', 'examples', 'example', 'benchmarks', 'scripts', 'bin'])
async function importNames(site, dist) {
  const info = (await readdir(site)).find((d) => d.endsWith('.dist-info') && normalize(d.replace(/-[^-]+\.dist-info$/, '')) === normalize(dist))
  if (!info) return []
  const files = (await readFile(path.join(site, info, 'RECORD'), 'utf8')).split('\n').map((l) => l.split(',')[0]).filter((f) => f && !f.startsWith('..') && !/^[^/]+\.(dist-info|data)\//.test(f) && !f.includes('__pycache__/'))
  const isInit = (f) => /(^|\/)__init__\.pyi?$/.test(f)
  const found = new Set()
  for (const f of files) {
    const parts = f.split('/')
    if (parts.length === 1) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)(\.pyi?|\.[A-Za-z0-9_.-]*\.so|\.so|\.pyd)$/.exec(f)
      if (m) found.add(m[1])
    } else if (isInit(f)) {
      // Only the shallowest package on each path: no ancestor has an __init__.
      const dirs = parts.slice(0, -1)
      const ancestorIsPackage = dirs.slice(0, -1).some((_, i) => files.some((g) => isInit(g) && g.split('/').slice(0, -1).join('/') === dirs.slice(0, i + 1).join('/')))
      if (!ancestorIsPackage) found.add(dirs.join('.').replace(/-stubs(?=\.|$)/, ''))
    }
  }
  const all = [...found].filter((m) => m.split('.').every((p) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(p)))
  const publicNames = all.filter((m) => !m.split('.').some((p) => p.startsWith('_') || SKIP.has(p)))
  const chosen = publicNames.length ? publicNames : all
  const own = normalize(dist).replace(/-/g, '_')
  return chosen.sort((a, b) => (b === own) - (a === own) || a.localeCompare(b))
}

async function runMypy(venv, entry, extra = []) {
  const r = await timed([...MYPY, '--python-executable', path.join(venv, 'bin', 'python'), ...extra, entry], { cwd: path.dirname(entry) })
  const errors = [...r.stdout.matchAll(/^(.+?):(\d+): error: (.*?)\s+\[([a-z-]+)\]$/gm)].map(([, file, line, message, code]) => ({ file, line: Number(line), message, code }))
  return { ...r, errors, hints: [...r.stdout.matchAll(/pip install ([A-Za-z0-9_.-]+)"/g)].map((m) => m[1]) }
}
// Deterministic size: how many modules mypy parsed.
const parsedFiles = async (venv, entry) => ((await timed([...MYPY, '--python-executable', path.join(venv, 'bin', 'python'), '-v', entry], { cwd: path.dirname(entry) })).stderr.match(/^LOG:\s+Parsing /gm) ?? []).length

// The empty baseline: `pass`, checked against an empty venv.
await mkdir(WORK, { recursive: true })
const baseDir = path.join(WORK, '__baseline__')
await makeVenv(path.join(baseDir, 'venv'))
await writeFile(path.join(baseDir, 'entry.py'), 'pass\n')
await writeFile(path.join(baseDir, 'invalid.py'), 'def bad() -> int:\n    return "wrong"\n')
if ((await runMypy(path.join(baseDir, 'venv'), path.join(baseDir, 'invalid.py'))).status === 0) throw new Error('mypy accepted a deliberate type error')
const baseArgv = [...MYPY, '--python-executable', path.join(baseDir, 'venv', 'bin', 'python'), path.join(baseDir, 'entry.py')]
const baseline = await measure(baseArgv, { cwd: baseDir }, RUNS)
baseline.files = await parsedFiles(path.join(baseDir, 'venv'), path.join(baseDir, 'entry.py'))
console.error(`baseline: ${baseline.cpuMs} ms CPU (spread ${spread(baseline.runs.map((r) => r.cpuMs))}), ${baseline.peakRssMb} MB, ${baseline.files} files`)

async function measureEntry(venv, entry) {
  const m = await measure([...MYPY, '--python-executable', path.join(venv, 'bin', 'python'), entry], { cwd: path.dirname(entry) }, RUNS)
  if (m.runs.some((r) => r.status !== 0)) return null
  return {
    cpuMs: round(m.cpuMs - baseline.cpuMs, 1),
    memoryMb: round(m.peakRssMb - baseline.peakRssMb, 1),
    timeMs: round(m.timeMs - baseline.timeMs, 1),
    files: (await parsedFiles(venv, entry)) - baseline.files,
    cpuSpreadMs: spread(m.runs.map((r) => r.cpuMs)),
    runs: m.runs,
  }
}

async function measurePackage({ name }) {
  const dir = path.join(WORK, normalize(name))
  const venv = path.join(dir, 'venv')
  const entry = path.join(dir, 'entry.py')
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  try {
    const site = await makeVenv(venv)
    const wanted = listedVersion[name]
    let installed
    try {
      // "Latest" means the newest release inside the age window.
      const pinned = wanted && (await eligible(name, wanted))
      installed = await install(site, pinned ? `${name}==${wanted}` : name, dir, 'package')
    } catch (err) {
      return { status: 'install-failed', listedVersion: wanted, detail: String(err.stderr || err.message).trim().split('\n').filter((l) => /ERROR|gate|wheel/i.test(l)).slice(0, 2).join(' | ').slice(0, 300) || String(err.message).slice(0, 300) }
    }
    const result = { version: installed.version, listedVersion: wanted, closure: installed.closure.length, installMb: await duMb(site) }
    let modules = await importNames(site, installed.name)
    if (modules.length === 0) return { status: 'no-entry', ...result, detail: 'no importable module in RECORD' }
    const write = () => writeFile(entry, modules.map((m) => `import ${m}`).join('\n') + '\n')
    await write()
    let probe = await runMypy(venv, entry)
    let typesFrom = 'bundled'
    const untyped = () => probe.errors.filter((e) => e.code === 'import-untyped').map((e) => modules[e.line - 1])
    if (untyped().length) {
      // Like DefinitelyTyped for npm: a separate stub distribution.
      const candidates = [...new Set([...probe.hints, `types-${installed.name}`, `${installed.name}-stubs`])]
      for (const candidate of candidates) {
        try {
          const stubs = await install(site, candidate, dir, 'stubs')
          const again = await runMypy(venv, entry)
          if (again.errors.filter((e) => e.code === 'import-untyped').length < untyped().length) {
            typesFrom = `${stubs.name}@${stubs.version}`
            // Named by mypy itself (its list of known stub distributions), or only guessed from the name.
            result.stubsPublisher = await stubsPublisher(stubs.name, installed.name)
            if (result.stubsPublisher !== 'same-project') result.communityTypes = true
            probe = again
            break
          }
        } catch {
          // no such distribution, or nothing old enough: try the next
        }
      }
    }
    // Keep only the imports mypy can type; a package none of whose modules is
    // typed is untyped.
    const dropped = probe.errors.filter((e) => ['import-untyped', 'import-not-found'].includes(e.code))
    if (dropped.length) {
      const bad = new Set(dropped.map((e) => modules[e.line - 1]))
      const kept = modules.filter((m) => !bad.has(m))
      if (kept.length === 0) {
        const status = dropped.every((e) => e.code === 'import-not-found') ? 'no-entry' : 'untyped'
        const out = { status, ...result, modules }
        if (status === 'untyped' && has('infer-untyped')) {
          // What following imports into the unannotated source would cost: mark
          // the scratch copy as typed. Recorded beside the status, not as it.
          for (const m of modules) await writeFile(path.join(site, m.split('.')[0], 'py.typed'), '').catch(() => {})
          const inferred = await runMypy(venv, entry)
          out.sourceInferred = inferred.status === 0 ? await measureEntry(venv, entry) : { failed: inferred.stdout.trim().split('\n')[0].slice(0, 200) }
          if (out.sourceInferred?.runs) delete out.sourceInferred.runs
        }
        return out
      }
      result.droppedModules = [...bad]
      modules = kept
      await write()
      probe = await runMypy(venv, entry)
    }
    if (probe.status !== 0) return { status: 'check-failed', ...result, modules, detail: (probe.stdout + probe.stderr).trim().split('\n')[0].replaceAll(dir, '').slice(0, 300) }
    const mypy = await measureEntry(venv, entry)
    if (!mypy) return { status: 'check-failed', ...result, modules, detail: 'a measured run failed' }
    return { status: 'ok', ...result, typesFrom, modules, added: { cpuMs: Math.max(0, mypy.cpuMs), memoryMb: Math.max(0, mypy.memoryMb) }, mypy, baseline: { cpuMs: baseline.cpuMs, peakRssMb: baseline.peakRssMb } }
  } finally {
    if (!has('keep')) await rm(dir, { recursive: true, force: true })
  }
}

const header = {
  checker: { tool: 'mypy', version: lock.mypy },
  method: { hostPython: pyVersion, targetPython: TARGET_PYTHON, flags: MYPY.slice(3), program: 'import <each public top-level module>', stubs: 'mypy hint, types-<name>, <name>-stubs; community ones marked' },
  minReleaseAgeDays: MIN_RELEASE_AGE_DAYS,
  memoryKind: 'peak RSS of the checker process',
  scoreBasis: 'added process CPU ms * added peak RSS MB',
  runs: RUNS,
  baseline,
}
await sweep({
  out: OUT,
  header,
  targets,
  force: has('force'),
  retryFailed: has('retry-failed'),
  measureOne: measurePackage,
  summary: (r) => (r.status === 'ok' ? `+${r.mypy.cpuMs} ms CPU (spread ${r.mypy.cpuSpreadMs}), +${r.mypy.memoryMb} MB, +${r.mypy.files} files (${r.typesFrom}${r.stubsPublisher ? ` by ${r.stubsPublisher}` : ''}; ${r.modules.join(', ')})` : `${r.status}${r.detail ? `: ${r.detail}` : ''}${r.sourceInferred?.cpuMs !== undefined ? ` [source-inferred +${r.sourceInferred.cpuMs} ms, +${r.sourceInferred.memoryMb} MB]` : ''}`) + ` v${r.version ?? '?'}`,
})
