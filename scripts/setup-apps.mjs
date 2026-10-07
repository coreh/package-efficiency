// Install and build the applications that several tasks share (one built
// server per framework), so that measuring them needs neither the network nor
// a build. Each application's own prepare.mjs does the work, under the
// repository's rules: nothing published in the last seven days, no install
// scripts. Safe to run again; what is already installed and built is skipped.
// Usage: node scripts/setup-apps.mjs [--only=next,django]
import { prepareApp, sharedApps } from './lib/apps.mjs'
import { loadConfig } from './lib/util.mjs'

const only = process.argv.find((a) => a.startsWith('--only='))?.slice('--only='.length).split(',')
const config = await loadConfig()
let failed = 0
for (const app of await sharedApps()) {
  if (only && !only.some((name) => app.name.endsWith(`/${name}`))) continue
  for (const runtimeId of app.runtimes) {
    const runtime = config.runtimes[runtimeId] ?? config.toolchains[runtimeId]
    try {
      const prepared = await prepareApp(app.dir, runtimeId, runtime, app.variant)
      console.error(`ok      ${app.name} for ${runtimeId}${prepared.version ? `: ${prepared.version}` : ''}`)
    } catch (error) {
      failed++
      console.error(`FAILED  ${app.name} for ${runtimeId}: ${String(error.stderr || error.message).trim().split('\n')[0]}`)
    }
  }
}
if (failed) process.exitCode = 1
