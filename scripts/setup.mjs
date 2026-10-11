// Get a machine ready to measure: install the pinned tools and packages and
// check that the language toolchains are the expected ones. Safe to run again;
// every step skips what is already in place.
//
// Everything is installed under the repository's rules: nothing published in
// the last seven days, and no install scripts (see .npmrc).
// Usage: node scripts/setup.mjs
import { execFileSync } from 'node:child_process'
import { duration, runStep } from './lib/tasks.mjs'
import { fromRoot, nativeBin } from './lib/util.mjs'

// The measurements start these programs; say plainly which are missing.
// The ones runtimes.json names per machine are looked for where it says.
const bin = (group, id) => { try { return nativeBin(group, id) } catch { return id } }
const needed = [
  ['node', 'node', ['--version'], 'runs the scripts and the JavaScript adapters'],
  ['cargo', 'cargo', ['--version'], 'builds the Rust adapters'],
  ['go', bin('toolchains', 'go'), ['version'], 'builds the Go adapters'],
  ['python3', bin('runtimes', 'cpython'), ['--version'], 'runs the Python adapters and type checker'],
  ['ruby', bin('runtimes', 'ruby'), ['--version'], 'runs the Ruby adapters'],
]
const missing = []
console.error('=== toolchains on this machine ===')
for (const [command, file, args, purpose] of needed) {
  try {
    console.error(`  ${command.padEnd(8)} ${execFileSync(file, args, { encoding: 'utf8' }).trim().split('\n')[0]}`)
  } catch {
    missing.push(command)
    console.error(`  ${command.padEnd(8)} NOT FOUND (${purpose})`)
  }
}

const npmFlags = ['install', '--min-release-age=7', '--ignore-scripts', '--no-audit', '--no-fund']
const steps = [
  runStep('site and script dependencies (npm)', 'npm', npmFlags),
  runStep('pinned runtimes and compilers: Bun, Deno, TypeScript (npm)', 'npm', npmFlags, { cwd: fromRoot('toolchains') }),
  runStep('pinned native toolchains (PyPy; on Linux also Rust, Go, CPython, CRuby)', process.execPath, ['scripts/setup-native.mjs']),
  runStep('type checkers: mypy, Sorbet', process.execPath, ['scripts/setup-checkers.mjs']),
  runStep('Python, Ruby and Go server packages', process.execPath, ['scripts/setup-http-servers.mjs']),
  runStep('age of the locked Rust crates', process.execPath, ['scripts/check-cargo-age.mjs']),
  // After the server packages and runtimes above, which the applications use.
  runStep('applications shared by several tasks: install and build', process.execPath, ['scripts/setup-apps.mjs']),
]

console.error(`\n${steps.map((s) => `${s.ok ? 'ok    ' : 'FAILED'}  ${s.title}  (${duration(s.seconds)})`).join('\n')}`)
if (missing.length) console.error(`\nMissing on this machine: ${missing.join(', ')}. Tasks that need them will fail until they are installed.`)
if (steps.some((s) => !s.ok)) process.exitCode = 1
