// Add install sizes to results that were measured before sizes were
// recorded, from the work folders the measurement left behind. Measuring
// records them itself from now on; this changes nothing else in a result.
// Usage: node scripts/record-install-size.mjs [--cache=<another .cache folder>]
import { globSync } from 'node:fs'
import path from 'node:path'
import { binaryInstall, nodeInstall } from './lib/install-size.mjs'
import { fromRoot, readJson, writeJson } from './lib/util.mjs'

const other = process.argv.find((a) => a.startsWith('--cache='))?.slice('--cache='.length)
const caches = [fromRoot('.cache'), ...(other ? [path.resolve(other)] : [])]
let added = 0, missing = 0
for (const file of globSync('*/*/{npm,jsr,cargo}/**/*.json', { cwd: fromRoot('results') })) {
  const result = await readJson(fromRoot('results', file))
  if (result.install || result.status !== 'ok') continue
  let install = null
  for (const cache of caches) {
    if (result.ecosystem === 'cargo') {
      const manifest = fromRoot('benchmarks', result.task, 'cargo', result.package, 'Cargo.toml')
      const crate = /^name = "(.+)"/m.exec(await import('node:fs').then((fs) => fs.existsSync(manifest) ? fs.readFileSync(manifest, 'utf8') : ''))?.[1]
      install = crate ? binaryInstall(path.join(cache, 'cargo-target/release', crate), path.join(cache, 'cargo-target/release/baseline')) : null
    } else {
      // Variants share the work folder of the package they are a variant of.
      const meta = await readJson(fromRoot('benchmarks', result.task, result.ecosystem, result.package, 'adapter.json'), {})
      install = nodeInstall(path.join(cache, 'work', result.task, result.ecosystem, meta.package ?? result.package))
    }
    if (install) break
  }
  if (!install) { missing++; continue }
  await writeJson(fromRoot('results', file), { ...result, install })
  added++
}
console.log(`install size added to ${added} results; ${missing} have no work folder left to measure`)
