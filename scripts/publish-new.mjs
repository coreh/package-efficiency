// Measures what is written and not run yet, a task at a time, and publishes
// as it goes: after about every twenty minutes of measuring it records the
// missing type checks, builds, commits, pushes and deploys.
// Usage: node scripts/publish-new.mjs [--categories=a,b] [--every=20] [--no-deploy]
//   --categories  only tasks of these categories (default: every task with
//                 an adapter that has no result)
// A lock file stops two of these from running at once.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { fromRoot, ROOT } from './lib/util.mjs'

const flag = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const only = flag('categories')?.split(',')
const everyMs = Number(flag('every') ?? 20) * 60_000
const deploy = !process.argv.includes('--no-deploy')
const lock = fromRoot('.cache/publish-new.lock')
if (existsSync(lock)) { console.error(`already running (${lock})`); process.exit(1) }
writeFileSync(lock, String(process.pid))
process.on('exit', () => rmSync(lock, { force: true }))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(1))

const run = (command, args, options = {}) => spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options })
const say = (text) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${text}`)
const pending = () => JSON.parse(execFileSync(process.execPath, ['scripts/unmeasured.mjs', '--json'], { cwd: ROOT, encoding: 'utf8' })).filter((t) => !only || only.includes(t.task.split('/')[0]))

function publish(measured) {
  say(`publishing after ${measured.length} task(s): ${measured.join(', ')}`)
  const checks = run(process.execPath, ['scripts/measure-native-checks.mjs', '--missing'])
  say(`type checks: exit ${checks.status}${checks.status ? ` ${String(checks.stderr).trim().split('\n').at(-1)}` : ''}`)
  const data = run(process.execPath, ['scripts/build-data.mjs'])
  const site = data.status === 0 ? run(process.execPath, ['scripts/build-site.mjs']) : data
  if (site.status !== 0) { say(`BUILD FAILED: ${String(site.stderr).trim().split('\n').slice(0, 3).join(' | ')}`); return false }
  say(String(site.stdout).trim().split('\n').at(-1))
  const files = Number(execFileSync('sh', ['-c', 'find dist -type f | wc -l'], { cwd: ROOT, encoding: 'utf8' }))
  run('git', ['add', '-A'])
  run('git', ['commit', '-q', '-m', `Results: ${measured.length} task(s) with new entries (provisional)\n\n${measured.join('\n')}`])
  const pushed = run('git', ['push', '-q', 'origin', 'main'])
  say(`committed ${execFileSync('git', ['log', '--oneline', '-1'], { cwd: ROOT, encoding: 'utf8' }).trim().slice(0, 60)}${pushed.status ? ' (PUSH FAILED)' : ''}; ${files} site files`)
  if (deploy) {
    if (files > 19_500) { say(`NOT DEPLOYED: ${files} files is too close to the limit of 20,000`); return false }
    const out = run('npx', ['wrangler', 'deploy'], { env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: 'b77239910afe90156f34b35f07727fc9' } })
    say(out.status === 0 ? `deployed ${/Current Version ID: (\S+)/.exec(out.stdout)?.[1] ?? ''}` : `DEPLOY FAILED: ${String(out.stdout + out.stderr).split('\n').find((line) => /ERROR|exceeds/.test(line)) ?? ''}`)
  }
  const free = execFileSync('sh', ['-c', "df -g . | tail -1 | awk '{print $4}'"], { cwd: ROOT, encoding: 'utf8' }).trim()
  say(`disk: ${free} GB free`)
  if (Number(free) < 8) { say('STOPPING: under 8 GB free'); process.exit(3) }
  return true
}

let since = Date.now(), batch = []
const tried = new Set()
for (;;) {
  const next = pending().find((t) => !tried.has(t.task))
  if (!next) break
  tried.add(next.task)
  say(`measure ${next.task} (${next.missing.length} without a result)`)
  const out = run(process.execPath, ['scripts/measure.mjs', next.task, '--keep-existing'])
  const lines = String(out.stdout + out.stderr).split('\n').filter((line) => / on \S+: /.test(line))
  for (const line of lines) console.log(`    ${line.slice(0, 200)}`)
  if (!lines.length) say(`  no entries measured; exit ${out.status}: ${String(out.stderr).trim().split('\n').at(-1)?.slice(0, 200)}`)
  batch.push(next.task)
  if (Date.now() - since > everyMs) { publish(batch); batch = []; since = Date.now() }
}
if (batch.length) publish(batch)
say('nothing left to measure')
