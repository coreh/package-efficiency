import http from 'node:http'
import followRedirects from 'follow-redirects'
let options
export function connect(peer) {
  options = { host: peer.host, port: peer.port, method: 'POST', agent: new http.Agent({ keepAlive: true, maxSockets: peer.concurrency }) }
}
export function operation(input) {
  return new Promise((resolve, reject) => {
    const request = followRedirects.http.request(
      { ...options, path: input.path, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(input.body) } },
      (response) => {
        let text = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => (text += chunk))
        response.on('error', reject)
        response.on('end', () => {
          if (response.statusCode < 200 || response.statusCode > 299) return reject(new Error(`status ${response.statusCode}`))
          try {
            resolve(JSON.parse(text))
          } catch (error) {
            reject(error)
          }
        })
      },
    )
    request.on('error', reject)
    request.end(input.body)
  })
}
export function close() {
  options.agent.destroy()
}
