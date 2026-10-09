import http from 'node:http'
import followRedirects from 'follow-redirects'
let options
export function connect(peer) {
  options = { host: peer.host, port: peer.port, agent: new http.Agent({ keepAlive: true, maxSockets: peer.concurrency }) }
}
export function operation(input) {
  return new Promise((resolve, reject) => {
    followRedirects.http
      .get({ ...options, path: input.path }, (response) => {
        let text = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => (text += chunk))
        response.on('error', reject)
        response.on('end', () => {
          if (response.statusCode !== 200) return reject(new Error(`status ${response.statusCode}`))
          try {
            resolve(JSON.parse(text))
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', reject)
  })
}
export function close() {
  options.agent.destroy()
}
