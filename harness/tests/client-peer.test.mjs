// The scripted HTTP peer of client tasks answers what its script lists and
// refuses, and records, everything else. Needs the peer built
// (scripts/measure.mjs builds it for any client task); skipped otherwise.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startPeer } from '../client.mjs'

const command = new URL('../../.cache/cargo-target/release/http-peer', import.meta.url).pathname
const script = {
  keepAlive: true,
  routes: [
    { method: 'GET', path: '/a', status: 200, contentType: 'application/json', body: '{"a":1}' },
    { method: 'POST', path: '/b', requestBody: '{"x":"é"}', requestContentType: 'application/json', status: 201, contentType: 'application/json', body: '{"ok":true}' },
  ],
}

// Sends raw bytes on a new connection and returns everything that came back
// once the peer closed it or `quietMs` passed without more.
function exchange(port, bytes, quietMs = 150) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, '127.0.0.1')
    let text = ''
    let timer
    const done = () => {
      socket.destroy()
      resolve(text)
    }
    socket.on('connect', () => {
      socket.write(bytes)
      timer = setTimeout(done, quietMs)
    })
    socket.on('data', (chunk) => {
      text += chunk
      clearTimeout(timer)
      timer = setTimeout(done, quietMs)
    })
    socket.on('close', () => {
      clearTimeout(timer)
      resolve(text)
    })
    socket.on('error', reject)
  })
}

test('the HTTP peer answers its script and refuses the rest', { skip: !existsSync(command) && 'http-peer is not built' }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'peer-test-'))
  const peer = await startPeer({ command, script, dir })
  try {
    assert.equal(peer.exchanges, 2)
    const host = `Host: 127.0.0.1:${peer.port}\r\n`
    const body = Buffer.from('{"x":"é"}')
    const post = (extra = '', sent = body) => Buffer.concat([Buffer.from(`POST /b HTTP/1.1\r\n${host}Content-Type: application/json\r\nContent-Length: ${sent.length}\r\n${extra}\r\n`), sent])

    // Two requests on one connection, the second pipelined behind the first.
    const good = await exchange(peer.port, Buffer.concat([Buffer.from(`GET /a HTTP/1.1\r\n${host}\r\n`), post()]))
    assert.match(good, /^HTTP\/1\.1 200 OK\r\nContent-Type: application\/json\r\nContent-Length: 7\r\n\r\n\{"a":1\}HTTP\/1\.1 201 Created\r\n/)
    assert.ok(good.endsWith('{"ok":true}'))
    let stats = await peer.stats()
    assert.deepEqual([stats.accepted, stats.refused, stats.connections], [[1, 1], 0, 1])

    const refused = [
      [`GET /nowhere HTTP/1.1\r\n${host}\r\n`, /no route/],
      [`GET /a HTTP/1.0\r\n${host}\r\n`, /expected HTTP\/1\.1/],
      [`GET  /a HTTP/1.1\r\n${host}\r\n`, /malformed request line/],
      ['GET /a HTTP/1.1\r\n\r\n', /0 Host headers/],
      ['GET /a HTTP/1.1\r\nHost: localhost\r\n\r\n', /Host is "localhost"/],
      [`GET /a HTTP/1.1\r\n${host}Content-Length: 2\r\n\r\nhi`, /takes no body/],
      [`GET /a HTTP/1.1\r\n${host}broken header\r\n\r\n`, /malformed header line/],
      [`POST /b HTTP/1.1\r\n${host}Content-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n9\r\n{"x":"e"}\r\n0\r\n\r\n`, /Transfer-Encoding/],
      [post('', Buffer.from('{"x":"e"} ')), /not the scripted one/],
      [post('', Buffer.from('{"x":1}')), /Content-Length is Some\(7\), expected 10/],
      [Buffer.concat([Buffer.from(`POST /b HTTP/1.1\r\n${host}Content-Type: text/plain\r\nContent-Length: ${body.length}\r\n\r\n`), body]), /Content-Type/],
    ]
    for (const [bytes, why] of refused) {
      const answer = await exchange(peer.port, bytes)
      assert.match(answer, /^HTTP\/1\.1 400 Bad Request\r\n/, String(bytes))
      stats = await peer.stats()
      assert.deepEqual([stats.accepted, stats.refused, stats.connections], [[0, 0], 1, 1], String(bytes))
      assert.match(stats.firstRefusal, why)
    }

    // A request cut short is recorded too.
    await exchange(peer.port, `GET /a HTTP/1.1\r\n${host}`)
    stats = await peer.stats()
    assert.equal(stats.refused, 1)
    assert.match(stats.firstRefusal, /ended inside a request head/)
    assert.ok(stats.cpuMs >= 0)
  } finally {
    await peer.stop()
    await rm(dir, { recursive: true, force: true })
  }
  // Stopped means gone: the port no longer accepts.
  await assert.rejects(exchange(peer.port, 'x'))
})

test('a peer without keep-alive closes after each response', { skip: !existsSync(command) && 'http-peer is not built' }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'peer-test-'))
  const peer = await startPeer({ command, script: { ...script, keepAlive: false }, dir })
  try {
    const request = `GET /a HTTP/1.1\r\nHost: 127.0.0.1:${peer.port}\r\n\r\n`
    const answer = await exchange(peer.port, request + request, 5_000)
    assert.equal(answer, 'HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 7\r\nConnection: close\r\n\r\n{"a":1}')
  } finally {
    await peer.stop()
    await rm(dir, { recursive: true, force: true })
  }
})
