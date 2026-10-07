// Short links to result pages: a code, once given, never changes or moves.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { issueShortLinks } from '../../site/label.mjs'

const addresses = Array.from({ length: 3000 }, (_, i) => `/results/task/one/node/npm/package-${i}@1.0.${i}/`)

test('every address gets one code of six or more safe characters, and no code is shared', () => {
  const record = issueShortLinks({}, addresses)
  assert.equal(Object.keys(record).length, addresses.length)
  assert.equal(new Set(Object.values(record)).size, addresses.length)
  for (const code of Object.keys(record)) assert.match(code, /^[0-9a-hjkmnp-tv-z]{6,}$/)
})
test('the same addresses give the same codes whatever order they come in', () => {
  assert.deepEqual(issueShortLinks({}, addresses), issueShortLinks({}, [...addresses].reverse()))
})
test('codes already given out are kept when more results are added', () => {
  const first = issueShortLinks({}, addresses.slice(0, 1500))
  const later = issueShortLinks(first, addresses)
  for (const [code, address] of Object.entries(first)) assert.equal(later[code], address)
  assert.equal(Object.keys(later).length, addresses.length)
})
test('a new result whose hash starts with a code that is taken gets a longer one, and the old link stays', () => {
  const [address] = addresses
  const [code] = Object.keys(issueShortLinks({}, [address]))
  // Pretend an earlier result already holds the code this address would get.
  const record = issueShortLinks({ [code]: '/results/earlier/' }, [address])
  assert.equal(record[code], '/results/earlier/')
  const mine = Object.keys(record).find((c) => record[c] === address)
  assert.ok(mine.length === code.length + 1 && mine.startsWith(code))
})
