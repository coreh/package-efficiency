// Check Cargo.lock as it is, before anything is compiled: fail if any locked
// crate version was published less than MIN_RELEASE_AGE_DAYS ago. Cargo's
// min-publish-age (used by lock-crates.mjs) applies only when it resolves;
// this also covers a lock changed any other way. Cargo has no way to skip
// build scripts, so nothing too new may reach a build.
// Usage: node scripts/check-cargo-age.mjs [--fix]   (lock-crates.mjs runs it)
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'

const MIN_RELEASE_AGE_DAYS = 7
// Kept in the repository, so a new machine asks only for what is new.
const CACHE = 'toolchains/crate-ages.json'
const DAY_MS = 86_400_000

const lock = await readFile('Cargo.lock', 'utf8')
const crates = [...lock.matchAll(/\[\[package\]\]\nname = "(.+)"\nversion = "(.+)"\nsource = "registry\+/g)].map(
  ([, name, version]) => ({ name, version }),
)

// Publish dates never change, so they are cached across runs.
const ages = await readFile(CACHE, 'utf8').then(JSON.parse, () => ({}))
const pending = crates.filter((c) => !ages[`${c.name}@${c.version}`])
// Publish times are in Cargo's own index (`pubtime`, what Cargo's
// min-publish-age reads): static files on a CDN, one per crate with every
// version, so they are fetched in parallel. The API, at one request a
// second, is asked only for a version the index has no time for.
const indexPath = (name) => {
  const n = name.toLowerCase()
  return n.length <= 2 ? `${n.length}/${n}` : n.length === 3 ? `3/${n[0]}/${n}` : `${n.slice(0, 2)}/${n.slice(2, 4)}/${n}`
}
const names = [...new Set(pending.map((c) => c.name))]
const fromIndex = async (name) => {
  const res = await fetch(`https://index.crates.io/${indexPath(name)}`, { headers: { 'user-agent': 'npm-efficiency release-age check' } })
  if (!res.ok) throw new Error(`${name}: index.crates.io returned HTTP ${res.status}`)
  for (const line of (await res.text()).split('\n').filter(Boolean)) {
    const entry = JSON.parse(line)
    if (entry.pubtime && pending.some((c) => c.name === name && c.version === entry.vers)) ages[`${name}@${entry.vers}`] = entry.pubtime
  }
}
// 32 at a time, each taking the next name as soon as it is done.
let next = 0
await Promise.all(Array.from({ length: 32 }, async () => { while (next < names.length) await fromIndex(names[next++]) }))
for (const { name, version } of pending.filter((c) => !ages[`${c.name}@${c.version}`])) {
  const res = await fetch(`https://crates.io/api/v1/crates/${name}/${version}`, {
    headers: { 'user-agent': 'npm-efficiency release-age check' },
  })
  if (!res.ok) throw new Error(`${name}@${version}: crates.io returned HTTP ${res.status}`)
  ages[`${name}@${version}`] = (await res.json()).version.created_at
  // crates.io asks API clients to stay at or below one request per second.
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
// Only the crates locked now, in a stable order.
const kept = Object.fromEntries(crates.map((c) => `${c.name}@${c.version}`).sort().map((key) => [key, ages[key]]))
await writeFile(CACHE, JSON.stringify(kept, null, 2) + '\n')

const now = Date.now()
const tooNew = crates
  .map((c) => ({ ...c, days: (now - new Date(ages[`${c.name}@${c.version}`])) / DAY_MS }))
  .filter((c) => c.days < MIN_RELEASE_AGE_DAYS)

if (tooNew.length) {
  for (const c of tooNew) console.error(`TOO NEW: ${c.name}@${c.version} (${c.days.toFixed(1)} days old)`)
  if (!process.argv.includes('--fix')) {
    console.error(`\nRun with --fix to pin each to its newest old-enough version.`)
    process.exit(1)
  }
  // Downgrade each to the newest release that is old enough, then ask the
  // caller to re-run: a downgrade can change which other versions are locked.
  for (const { name, version } of tooNew) {
    const res = await fetch(`https://crates.io/api/v1/crates/${name}/versions`, {
      headers: { 'user-agent': 'npm-efficiency release-age check' },
    })
    const { versions } = await res.json()
    const older = versions
      .filter((v) => !v.yanked && !v.num.split('+')[0].includes('-') && (now - new Date(v.created_at)) / DAY_MS >= MIN_RELEASE_AGE_DAYS)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      // Stay on the same major line (or minor line for 0.x) so dependents still resolve.
      .find((v) => v.num.split('.').slice(0, version.startsWith('0.') ? 2 : 1).join('.') === version.split('.').slice(0, version.startsWith('0.') ? 2 : 1).join('.'))
    if (!older) throw new Error(`${name}: no release older than ${MIN_RELEASE_AGE_DAYS} days on the ${version} line`)
    console.error(`pinning ${name} ${version} -> ${older.num}`)
    execFileSync('cargo', ['update', '-p', `${name}@${version}`, '--precise', older.num], { stdio: 'inherit' })
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  console.error('\nLockfile changed; run the check again.')
  process.exit(2)
}
console.log(`ok: all ${crates.length} locked crates are at least ${MIN_RELEASE_AGE_DAYS} days old`)
