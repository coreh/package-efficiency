// A client task: see "Client tasks" in benchmarks/README.md. The peer is the
// scripted Redis stand-in (harness/rust/src/bin/redis-peer.rs): it answers
// only the commands below, with these replies, and refuses, and records,
// anything else. It keeps no data: a GET is answered from the script.
const words = ['pedido', 'recibo', 'früh', 'naïve', '注文', 'заказ', 'order', 'receipt']
const value = (i) => {
  const size = [16, 48, 64, 128, 256, 384, 512, 1024][i]
  let text = ''
  for (let j = 0; Buffer.byteLength(text) < size; j++) text += `${words[(i + j) % words.length]}-${i * 31 + j} `
  // Cut at a character boundary, at or under the size.
  while (Buffer.byteLength(text) > size) text = text.slice(0, -1)
  return text
}
const pairs = Array.from({ length: 8 }, (_, i) => ({ key: `session:${1000 + i * 37}`, value: value(i) }))
const bulk = (text) => `$${Buffer.byteLength(text)}\r\n${text}\r\n`

export const peer = {
  program: 'redis',
  script: {
    commands: pairs.flatMap(({ key, value }) => [
      { request: ['SET', key, value], reply: '+OK\r\n' },
      { request: ['GET', key], reply: bulk(value) },
    ]),
  },
}

// Fixture i performs command i of the script: SET then GET of each key in
// turn. A SET returns "OK", a GET the string.
export const cases = pairs.flatMap(({ key, value }) => [
  { input: { command: 'SET', key, value }, expected: 'OK' },
  { input: { command: 'GET', key }, expected: value },
])
