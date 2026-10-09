// What cargo and rustc spend on a crate before any of its code is looked at:
// the cold `cargo check` of a program that depends on N empty library crates,
// for several N. Cargo starts one rustc per crate, so a dependency tree of 30
// crates pays 30 starts. The cost of one, the slope of CPU time over N, is
// written to data/cargo/startup.json; the site subtracts it once
// for every crate an entry's tree compiled (`compiledCrates`), so the graded
// figure is the check of the code and not the starting of compilers. Peak
// memory is that of the largest process and does not grow with N.
// Usage: node scripts/sweep-types/cargo-startup.mjs [--cold-runs=5]
// Nothing is downloaded: the empty crates are local path dependencies.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fromRoot, median, removeDir, round, timed, writeJson } from './lib.mjs'

const COLD_RUNS = Number(process.argv.find((a) => a.startsWith('--cold-runs='))?.split('=')[1] ?? 5)
const WORK = fromRoot('.cache/sweep-types/cargo')
const OUT = fromRoot('data/cargo/startup.json')
const ENV = { ...process.env, CARGO_HOME: path.join(WORK, 'home'), RUSTUP_HOME: process.env.RUSTUP_HOME ?? path.join(process.env.HOME, '.rustup'), CARGO_INCREMENTAL: '0', CARGO_TERM_COLOR: 'never', RUSTFLAGS: '' }
const COUNTS = [0, 1, 2, 4, 8, 16, 32, 64]

async function cold(count) {
  const dir = path.join(WORK, 'work', '__startup__')
  await removeDir(dir)
  await mkdir(path.join(dir, 'src'), { recursive: true })
  const names = Array.from({ length: count }, (_, i) => `empty${i}`)
  for (const name of names) {
    await mkdir(path.join(dir, name, 'src'), { recursive: true })
    await writeFile(path.join(dir, name, 'Cargo.toml'), `[package]\nname = "${name}"\nversion = "0.0.0"\nedition = "2021"\npublish = false\n`)
    await writeFile(path.join(dir, name, 'src/lib.rs'), '')
  }
  await writeFile(path.join(dir, 'Cargo.toml'), `[package]\nname = "probe"\nversion = "0.0.0"\nedition = "2021"\npublish = false\n\n[dependencies]\n${names.map((n) => `${n} = { path = "${n}" }`).join('\n')}\n\n[workspace]\n`)
  await writeFile(path.join(dir, 'src/main.rs'), `${names.map((n) => `use ${n} as _;`).join('\n')}\nfn main() {}\n`)
  const target = path.join(dir, 'target')
  const runs = []
  for (let i = 0; i < COLD_RUNS; i++) {
    await removeDir(target)
    const r = await timed(['cargo', 'check', '--offline', '--quiet'], { cwd: dir, env: { ...ENV, CARGO_TARGET_DIR: target } })
    if (r.status !== 0) throw new Error(`check of ${count} empty crates failed: ${r.stderr}`)
    runs.push({ cpuMs: round(r.cpuMs, 1), peakRssMb: round(r.peakRssMb, 1) })
  }
  await removeDir(dir)
  return { crates: count, cpuMs: median(runs.map((r) => r.cpuMs)), peakRssMb: median(runs.map((r) => r.peakRssMb)) }
}

const points = []
for (const count of COUNTS) {
  points.push(await cold(count))
  console.error(`${count} empty crates: ${points.at(-1).cpuMs} ms CPU, ${points.at(-1).peakRssMb} MB`)
}
// Least squares slope of CPU over the number of crates.
const n = points.length, sx = points.reduce((s, p) => s + p.crates, 0), sy = points.reduce((s, p) => s + p.cpuMs, 0)
const slope = (n * points.reduce((s, p) => s + p.crates * p.cpuMs, 0) - sx * sy) / (n * points.reduce((s, p) => s + p.crates ** 2, 0) - sx ** 2)
const rust = /\d+\.\d+\.\d+/.exec((await timed(['rustc', '--version'], { env: ENV })).stdout)?.[0] ?? null
await writeJson(OUT, { rust, perCrateCpuMs: round(slope, 1), coldRuns: COLD_RUNS, points, measuredAt: new Date().toISOString() })
console.error(`one crate start: ${round(slope, 1)} ms CPU`)
