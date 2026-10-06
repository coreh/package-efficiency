// The request mix and the response each request must produce. Shared by
// every adapter in every ecosystem; verification runs it in full.
const echoBody = (n) => ({
  message: `hello ${n}`,
  count: n,
  tags: ['alpha', 'beta', 'gamma'],
  nested: { ok: true, ratio: 0.5, missing: null },
})

export const requests = Array.from({ length: 32 }, (_, i) => {
  const id = 1000 + i * 37
  return [
    { method: 'GET', path: '/', expect: { status: 200, type: 'text/plain', text: 'Hello, World!' } },
    {
      method: 'GET',
      path: `/users/${id}`,
      expect: { status: 200, type: 'application/json', json: { id, name: `User ${id}` } },
    },
    {
      method: 'POST',
      path: '/echo',
      body: echoBody(i),
      expect: { status: 200, type: 'application/json', json: { echo: echoBody(i) } },
    },
  ]
}).flat()
