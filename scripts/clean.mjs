// Frees disk space: removes what the scripts can make again. Results, locks
// and pins are never touched; everything here is under .cache/.
//
// Usage: node scripts/clean.mjs [--all] [--dry-run]
//   default    what is only needed while a type sweep or type check runs:
//              downloaded packages of the sweeps, per-package type-check
//              installs, cargo's debug build directory, scratch directories
//   --all      also the download caches (npm, Go modules and build cache) and
//              every built adapter (.cache/work, .cache/cargo-target,
//              .cache/native-packages). The next measurement installs and
//              builds them again, which takes a long while.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fromRoot } from './lib/util.mjs'

const all = process.argv.includes('--all'), dry = process.argv.includes('--dry-run')
try {
  const running = execFileSync('pgrep', ['-fl', 'node .*scripts/(measure|refresh|sweep-types)'], { encoding: 'utf8' }).trim()
  if (running && !dry) {
    console.error(`A measurement is running; cleaning now would break it:\n${running}`)
    process.exit(1)
  }
} catch {}

const cache = (...parts) => fromRoot('.cache', ...parts)
const children = (dir, keep = () => false) => (existsSync(dir) ? readdirSync(dir).filter((name) => !keep(name)).map((name) => path.join(dir, name)) : [])
const targets = [
  ...['cargo/home', 'cargo/work', 'pypi/pip-cache', 'rubygems/gems', 'rubygems/work', 'rubygems/repos', 'rubygems/sigs'].map((dir) => cache('sweep-types', dir)),
  ...children(cache('types'), (name) => name === '__baseline__'),
  cache('cargo-target/debug'),
  cache('scratch'),
  ...(all ? ['npm', 'go-mod', 'go-build', 'work', 'cargo-target', 'native-packages', 'web-frameworks', 'http-servers', 'native-checks'].map((dir) => cache(dir)) : []),
].filter((target) => existsSync(target))

const sizeKb = (target) => Number(execFileSync('du', ['-sk', target], { encoding: 'utf8' }).split('\t')[0])
let total = 0
for (const target of targets) {
  const kb = sizeKb(target)
  total += kb
  if (kb >= 10_240) console.log(`${(kb / 1_048_576).toFixed(2).padStart(7)} GB  ${path.relative(fromRoot(), target)}`)
  // Go's module cache is read-only on disk.
  if (!dry) {
    if (target === cache('go-mod')) try { execFileSync('chmod', ['-R', 'u+w', target]) } catch {}
    rmSync(target, { recursive: true, force: true })
  }
}
console.log(`${dry ? 'would free' : 'freed'} ${(total / 1_048_576).toFixed(2)} GB${all ? '' : ' (more with --all)'}`)
