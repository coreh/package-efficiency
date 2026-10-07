// What the Rust applications' prepare.mjs files share: check, build and say
// how to start one crate of the repository's Cargo workspace.
//
// The applications are members of that workspace (its Cargo.toml takes every
// benchmarks/*/*/cargo/*), so they are locked by the one Cargo.lock at the
// root and built into .cache/cargo-target like every other Rust adapter:
//   - scripts/check-cargo-age.mjs fails if any locked crate is less than
//     seven days old, before anything is compiled (publish dates are cached,
//     so a lock that has not changed needs no network);
//   - cargo builds with --locked --offline --release, one crate at a time;
//     only if the sources are not yet downloaded does `cargo fetch --locked`
//     run first. Cargo itself skips what is already built.
// Cargo cannot skip build scripts or procedural macros (they are part of
// compiling a crate), so they run here as they do for the other Rust entries.
//
// The server process speaks the harness protocol through the bench-harness
// crate (harness/rust), the same code the http-server Rust entries use, and
// the baseline is that crate's empty `baseline` program.
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

let ageChecked = false
const built = new Set()

function build(root, cargo, crate, bin) {
  const out = path.join(root, '.cache/cargo-target/release', bin ?? crate)
  if (built.has(out)) return out
  if (!ageChecked) {
    execFileSync(process.execPath, ['scripts/check-cargo-age.mjs'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
    ageChecked = true
  }
  const args = ['build', '--locked', '--offline', '--release', '--quiet', '-p', crate, ...(bin ? ['--bin', bin] : [])]
  const run = () => execFileSync(cargo, args, { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
  try {
    run()
  } catch {
    // Most likely the locked crates are not downloaded yet: fetch exactly them, then build offline.
    execFileSync(cargo, ['fetch', '--locked'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
    run()
  }
  built.add(out)
  return out
}

// The versions of the crates `crate` depends on directly, from Cargo.lock.
// A dependency is listed as "name", or as "name version" when the lock holds
// more than one version of it.
function directDependencies(root, crate) {
  const packages = readFileSync(path.join(root, 'Cargo.lock'), 'utf8').split('\n[[package]]\n').slice(1).map((text) => ({
    name: /^name = "(.+)"$/m.exec(text)[1],
    version: /^version = "(.+)"$/m.exec(text)[1],
    registry: /^source = "registry\+/m.test(text),
    dependencies: [.../^dependencies = \[\n([^\]]*)\]/m.exec(text)?.[1].matchAll(/"([^" ]+)(?: ([^" ]+))?[^"]*"/g) ?? []].map(([, name, version]) => ({ name, version })),
  }))
  const versions = {}
  for (const { name, version } of packages.find((entry) => entry.name === crate).dependencies) {
    const found = packages.find((entry) => entry.name === name && (!version || entry.version === version))
    if (found.registry) versions[name] = found.version
  }
  return versions
}

// `crate` is the workspace member to build and `framework` the crate the
// entry is named for; the other direct dependencies are recorded beside it.
export function prepareCargo({ root, runtime, crate, framework }) {
  const baseline = build(root, runtime.bin, 'bench-harness', 'baseline')
  const command = build(root, runtime.bin, crate)
  const { [framework]: version, ...dependencies } = directDependencies(root, crate)
  return {
    version,
    dependencies,
    // What the application adds to an empty Rust program, as for the other Rust entries.
    install: { kind: 'binary', bytes: Math.max(0, statSync(command).size - statSync(baseline).size) },
    launch: { command, args: [], cwd: root, phases: ['boot', 'ready'] },
    base: { command: baseline, args: [], cwd: root },
  }
}
