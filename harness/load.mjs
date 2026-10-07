// Closed-loop HTTP/1.1 load generator on raw sockets, spread over worker
// threads so the client is not the bottleneck. Each connection sends one
// request, waits for the whole response, checks it, and sends the next.
import net from 'node:net'
import { isDeepStrictEqual } from 'node:util'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { fragmentOf, normalizeHtml } from './html.mjs'

const HEADER_END = Buffer.from('\r\n\r\n')

// `headers` adds request headers, such as the Accept-Encoding a browser sends.
function encodeRequest({ method, path, body, headers }) {
  const payload = body === undefined ? null : Buffer.from(JSON.stringify(body))
  const head =
    `${method} ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\n` +
    Object.entries(headers ?? {}).map(([name, value]) => `${name}: ${value}\r\n`).join('') +
    (payload ? `Content-Type: application/json\r\nContent-Length: ${payload.length}\r\n` : '') +
    '\r\n'
  return payload ? Buffer.concat([Buffer.from(head), payload]) : Buffer.from(head)
}

// Returns null until `buffer` holds one complete response.
function parseResponse(buffer) {
  const headerEnd = buffer.indexOf(HEADER_END)
  if (headerEnd === -1) return null
  const head = buffer.latin1Slice(0, headerEnd)
  const bodyStart = headerEnd + 4

  const length = /\r\ncontent-length:\s*(\d+)/i.exec(head)
  if (length) {
    const end = bodyStart + Number(length[1])
    return buffer.length < end ? null : { head, body: buffer.subarray(bodyStart, end), end }
  }
  if (/\r\ntransfer-encoding:\s*chunked/i.test(head)) {
    const parts = []
    for (let at = bodyStart; ; ) {
      const lineEnd = buffer.indexOf('\r\n', at)
      if (lineEnd === -1) return null
      const size = parseInt(buffer.latin1Slice(at, lineEnd), 16)
      const dataStart = lineEnd + 2
      const next = dataStart + size + 2
      if (buffer.length < next) return null
      if (size === 0) return { head, body: Buffer.concat(parts), end: next }
      parts.push(buffer.subarray(dataStart, dataStart + size))
      at = next
    }
  }
  return { head, body: buffer.subarray(bodyStart, bodyStart), end: bodyStart }
}

// The status is always checked; headers and body only in verify mode, so the
// measured rounds do not spend client time on comparisons.
function check({ head, body }, expect, verify) {
  const status = Number(head.slice(9, 12))
  if (status !== expect.status) return `expected status ${expect.status}, got ${status}`
  if (!verify) return null
  const type = /\r\ncontent-type:\s*([^\r;]+)/i.exec(head)?.[1].trim().toLowerCase()
  if (type !== expect.type) return `expected content-type ${expect.type}, got ${type}`
  // A compressed body is read as a browser would read it. Only here, when
  // verifying: the measured rounds do not decompress.
  const encoding = /\r\ncontent-encoding:\s*([^\r]+)/i.exec(head)?.[1].trim().toLowerCase()
  let plain = body
  try {
    if (encoding === 'gzip') plain = gunzipSync(body)
    else if (encoding === 'br') plain = brotliDecompressSync(body)
    else if (encoding === 'deflate') plain = inflateSync(body)
    else if (encoding && encoding !== 'identity') return `unknown content-encoding ${encoding}`
  } catch (error) {
    return `could not decompress the ${encoding} body: ${error.message}`
  }
  const text = plain.toString()
  if ('json' in expect) {
    let value
    try {
      value = JSON.parse(text)
    } catch {
      return `body is not JSON: ${text.slice(0, 80)}`
    }
    if (!isDeepStrictEqual(value, expect.json)) return `unexpected JSON body: ${text.slice(0, 120)}`
  } else if ('fragment' in expect) {
    // One element of an HTML page, compared after both are brought to one
    // spelling (see html.mjs). `html` is already normalized.
    const found = fragmentOf(text, expect.fragment.open, expect.fragment.close)
    if (found === null) return `no ${expect.fragment.open}…${expect.fragment.close} in the page: ${text.slice(0, 80)}`
    const got = normalizeHtml(found)
    if (got !== expect.fragment.html) {
      let at = 0
      while (at < got.length && got[at] === expect.fragment.html[at]) at++
      return `page differs at character ${at}: got "${got.slice(Math.max(0, at - 30), at + 50)}", expected "${expect.fragment.html.slice(Math.max(0, at - 30), at + 50)}"`
    }
  } else if (text !== expect.text) {
    return `unexpected body: ${text.slice(0, 80)}`
  }
  return null
}

if (!isMainThread) {
  const { port, requests, connections, perConnection, offset, verify } = workerData
  const encoded = requests.map(encodeRequest)
  const latencies = new Float32Array(connections * perConnection)
  let recorded = 0
  let errors = 0
  let firstError = null

  const open = () =>
    new Promise((resolve, reject) => {
      const socket = net.connect({ port, host: '127.0.0.1' })
      socket.setNoDelay(true)
      socket.once('error', reject)
      socket.once('connect', () => resolve(socket))
    })

  const drive = (socket, index) =>
    new Promise((resolve) => {
      let buffer = null
      let sent = 0
      let cursor = offset + index * 7
      let current = 0
      let startedAt = 0
      let done = false
      const finish = (error) => {
        if (done) return
        done = true
        if (error) {
          errors++
          firstError ??= error
        }
        socket.destroy()
        resolve()
      }
      const send = () => {
        if (sent === perConnection) return finish()
        current = cursor++ % requests.length
        sent++
        startedAt = performance.now()
        socket.write(encoded[current])
      }
      socket.on('data', (chunk) => {
        buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk
        for (let response; !done && (response = parseResponse(buffer)); ) {
          latencies[recorded++] = performance.now() - startedAt
          const problem = check(response, requests[current].expect, verify)
          if (problem) {
            errors++
            firstError ??= `${requests[current].method} ${requests[current].path}: ${problem}`
          }
          const rest = response.end === buffer.length ? null : buffer.subarray(response.end)
          buffer = rest
          send()
          if (!rest) break
        }
      })
      socket.on('error', (err) => finish(err.message))
      socket.on('close', () => finish('connection closed before all responses arrived'))
      send()
    })

  const sockets = await Promise.all(Array.from({ length: connections }, open))
  parentPort.once('message', async () => {
    await Promise.all(sockets.map(drive))
    const used = latencies.slice(0, recorded)
    parentPort.postMessage({ latencies: used, errors, firstError }, [used.buffer])
    parentPort.close()
  })
  parentPort.postMessage('ready')
}

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? null

// `onStart` runs after every connection is open and right before the first
// request is sent, so callers can take their "before" measurements there.
export async function runLoad({ port, requests, total, workers = 4, connections = 16, verify = false, onStart }) {
  const perConnection = Math.ceil(total / (workers * connections))
  const pool = Array.from(
    { length: workers },
    (_, w) =>
      new Worker(new URL(import.meta.url), {
        workerData: { port, requests, connections, perConnection, offset: w * 1009, verify },
      }),
  )
  const nextMessage = (worker) =>
    new Promise((resolve, reject) => {
      worker.once('message', resolve)
      worker.once('error', reject)
    })

  try {
    await Promise.all(pool.map(nextMessage))
    await onStart?.()
    const startedAt = performance.now()
    const results = await Promise.all(
      pool.map((worker) => {
        const result = nextMessage(worker)
        worker.postMessage('go')
        return result
      }),
    )
    const wallMs = performance.now() - startedAt

    const completed = results.reduce((sum, r) => sum + r.latencies.length, 0)
    const all = new Float32Array(completed)
    let at = 0
    for (const r of results) {
      all.set(r.latencies, at)
      at += r.latencies.length
    }
    all.sort()
    return {
      requests: completed,
      errors: results.reduce((sum, r) => sum + r.errors, 0),
      firstError: results.find((r) => r.firstError)?.firstError ?? null,
      wallMs,
      latencyP50Ms: quantile(all, 0.5),
      latencyP99Ms: quantile(all, 0.99),
    }
  } finally {
    await Promise.all(pool.map((worker) => worker.terminate()))
  }
}
