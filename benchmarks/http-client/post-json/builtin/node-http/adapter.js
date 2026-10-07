import http from 'node:http'
let options
export function connect(peer) {
  options = { host: peer.host, port: peer.port, method: 'POST', agent: new http.Agent({ keepAlive: true, maxSockets: peer.concurrency }) }
}
export function operation(input) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(input.body)
    const request = http.request({ ...options, path: input.path, headers: { 'content-type': 'application/json', 'content-length': body.length } }, (response) => {
      let text = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => (text += chunk))
      response.on('error', reject)
      response.on('end', () => {
        if (response.statusCode !== 201) return reject(new Error(`status ${response.statusCode}`))
        try {
          resolve(JSON.parse(text))
        } catch (error) {
          reject(error)
        }
      })
    })
    request.on('error', reject)
    request.end(body)
  })
}
export function close() {
  options.agent.destroy()
}
