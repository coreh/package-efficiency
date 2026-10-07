// measureClient checks every run from both ends: what the client returned and
// what the peer recorded. Needs the same process access as a real benchmark
// and the peer built (scripts/measure.mjs builds it for any client task).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { measureClient } from '../client.mjs'

const peerCommand = new URL('../../.cache/cargo-target/release/http-peer', import.meta.url).pathname
const runner = new URL('../js/client-runner.mjs', import.meta.url).pathname
const docs = [{ n: 1 }, { n: 2 }, { n: 3 }]
const script = { keepAlive: true, routes: docs.map((doc) => ({ method: 'GET', path: `/d/${doc.n}`, status: 200, contentType: 'application/json', body: JSON.stringify(doc) })) }
const cases = docs.map((doc) => ({ input: { path: `/d/${doc.n}` }, expected: doc }))
const load = { concurrency: 2, connections: 2, warmup: 6, rounds: 2, requestsPerRound: 30 }

const HEAD = `import http from 'node:http'
let options
export function connect(peer) { options = { host: peer.host, port: peer.port, agent: new http.Agent({ keepAlive: true, maxSockets: peer.concurrency }) } }
const get = (path, headers = {}) => new Promise((resolve, reject) => http.get({ ...options, path, headers }, (res) => { let text = ''; res.on('data', (c) => (text += c)); res.on('end', () => resolve(text)) }).on('error', reject))
`
const adapters = {
  honest: `${HEAD}export const operation = async (input) => JSON.parse(await get(input.path))`,
  // Answers from memory after the checks, without asking the peer.
  silent: `${HEAD}const seen = new Map()
export const operation = async (input) => { if (!seen.has(input.path)) seen.set(input.path, JSON.parse(await get(input.path))); return seen.get(input.path) }`,
  // Asks for something the task does not send, and hides it.
  wrongRequest: `${HEAD}export const operation = async (input) => { await get(input.path + '?x=1'); return { n: Number(input.path.slice(3)) } }`,
  // Returns something other than the document.
  wrongResult: `${HEAD}export const operation = async (input) => ({ ...JSON.parse(await get(input.path)), extra: true })`,
  // A new connection for every request, in a keep-alive task.
  noKeepAlive: `${HEAD}export const operation = async (input) => JSON.parse(await get(input.path, { connection: 'close' }))`,
}

async function run(source, overrides = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'client-test-'))
  try {
    await writeFile(path.join(dir, 'adapter.mjs'), source)
    return await measureClient({
      command: process.execPath, args: ['--expose-gc', runner, path.join(dir, 'adapter.mjs')], cwd: dir, phases: ['boot', 'loaded', 'ready'],
      load, cases, peer: { command: peerCommand, script },
      verifyResults: (outputs) => assert.deepEqual(outputs, cases.map((c) => c.expected)),
      ...overrides,
    })
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}
const peersRunning = () => {
  try {
    return execFileSync('pgrep', ['-f', peerCommand], { encoding: 'utf8' }).trim().split('\n').filter(Boolean).length
  } catch {
    return 0
  }
}
const skip = !existsSync(peerCommand) && 'http-peer is not built'

test('a client that performs the task is measured, with the peer outside it', { skip }, async () => {
  const result = await run(adapters.honest)
  assert.equal(result.status, 'ok', result.error)
  assert.deepEqual(result.rounds.map((r) => r.requests), [30, 30])
  assert.ok(result.rounds.every((r) => r.cpuMs > 0 && r.wallMs > 0 && r.peerCpuMs >= 0))
  assert.equal(result.warmupRounds.length, 2)
  assert.ok(result.connectionsOpened <= 2)
})

test('wrong clients fail, and the peer is stopped every time', { skip }, async () => {
  const before = peersRunning()
  const silent = await run(adapters.silent)
  assert.equal(silent.status, 'failed')
  assert.match(silent.error, /the peer did not receive what the task sends/)

  const wrongRequest = await run(adapters.wrongRequest)
  assert.equal(wrongRequest.status, 'verify-failed')
  assert.match(wrongRequest.error, /the peer refused 3 requests: no route for GET \/d\/1\?x=1/)

  const wrongResult = await run(adapters.wrongResult)
  assert.equal(wrongResult.status, 'verify-failed')

  const noKeepAlive = await run(adapters.noKeepAlive)
  assert.equal(noKeepAlive.status, 'failed', noKeepAlive.error)
  assert.match(noKeepAlive.error, /the client opened \d+ connections; the task allows 2 keep-alive connections/)

  // The same client is what a task about new connections asks for.
  const fresh = await run(adapters.noKeepAlive, { peer: { command: peerCommand, script: { ...script, keepAlive: false } } })
  assert.equal(fresh.status, 'ok', fresh.error)
  const kept = await run(adapters.honest, { peer: { command: peerCommand, script: { ...script, keepAlive: false } } })
  assert.equal(kept.status, 'ok', kept.error)

  const crashed = await run('throw new Error("does not load")')
  assert.equal(crashed.status, 'failed')
  assert.equal(peersRunning(), before)
})
