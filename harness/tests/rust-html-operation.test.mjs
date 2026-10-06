import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cases, verifyResults } from '../../benchmarks/html-escaping/text-attributes/scenario.mjs'
const root = fileURLToPath(new URL('../../', import.meta.url))
async function run(adapter, accept = true) {
  const dir = await mkdtemp(path.join(tmpdir(), 'rust-html-test-'))
  try {
    const file = path.join(dir, 'fixtures.json')
    await writeFile(file, JSON.stringify({ cases }))
    const child = spawn(path.join(root, '.cache/cargo-target/release', `html-escaping-${adapter}`), [file])
    const messages = []
    let verificationError, stderr = ''
    child.stderr.on('data', c => stderr += c)
    createInterface({ input: child.stdout }).on('line', line => {
      const message = JSON.parse(line.slice(2)); messages.push(message)
      if (message.phase === 'verification') {
        try {
          verifyResults(message.outputs)
          child.stdin.end(accept ? 'verified\n{"count":1000,"minMs":10}\nsettle\nexit\n' : 'exit\n')
        } catch (error) { verificationError = error; child.stdin.end('exit\n') }
      }
    })
    const code = await new Promise((resolve,reject) => { child.on('error',reject); child.on('close',resolve) })
    if (verificationError) throw verificationError
    return { code, messages, stderr }
  } finally { await rm(dir, { recursive: true, force: true }) }
}
for (const name of ['html-escape','htmlescape','askama-escape']) {
  test(`${name}: shared verifier accepts native output before measured work`, async () => {
    const {code,messages,stderr} = await run(name)
    assert.equal(code,0,stderr)
    assert.deepEqual(messages.map(m=>m.phase),['boot','verification','ready','round','settled'])
    const round=messages[3], lengths=messages[1].outputs.map(s=>Buffer.byteLength(s))
    assert.ok(round.wallMs>=10 && round.cpuMs>0)
    let checksum=0
    for(let i=0;i<round.operations;i++) checksum=(checksum+lengths[i%lengths.length])>>>0
    assert.equal(round.checksum,checksum)
  })
  test(`${name}: no measured work without verification acknowledgement`, async () => {
    const {code,messages} = await run(name,false)
    assert.equal(code,1)
    assert.deepEqual(messages.map(m=>m.phase),['boot','verification'])
  })
}
test('HTML verifier allows entity spelling differences but rejects missing/double escaping', () => {
  const outputs = cases.map(c=>c.expected)
  verifyResults(outputs.map(s=>s.replaceAll('&#39;','&#x27;').replaceAll('&lt;','&#60;').replaceAll('&gt;','&#62;').replaceAll('&amp;','&#38;').replaceAll('&quot;','&#34;')))
  assert.throws(()=>verifyResults(cases.map(c=>c.input)))
  assert.throws(()=>verifyResults(outputs.map(s=>s.replaceAll('&','&amp;'))))
  assert.throws(()=>verifyResults(outputs.slice(1)))
})
