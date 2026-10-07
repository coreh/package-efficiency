import { strict as assert } from 'node:assert'
// The schema (every adapter declares the same one):
//   type Query  { org(id: Int!): Org }
//   type Org    { id: Int!, name: String!, teams: [Team!]! }
//   type Team   { id: Int!, name: String!, tags: [String!]!, members: [Member!]! }
//   type Member { id: Int!, name: String!, active: Boolean!, score: Float, role: Role! }
//   enum Role   { ADMIN EDITOR VIEWER }
// The data, built the same way in every adapter:
//   org o in 1..3: name `org-o`; team t in 1..4: id o*10+t, name `team-id`, tags [`a<id>`, `b<id>`];
//   member m in 1..6: id = o*100+t*10+m, name `member-id`, active id%3 != 0,
//   score null when id%5 == 0 else (id%7)/2, role [ADMIN, EDITOR, VIEWER][id%3].
// The only resolver written by hand is Query.org (a lookup by id, null when absent).
const ROLES = ['ADMIN', 'EDITOR', 'VIEWER']
const orgs = new Map()
for (let o = 1; o <= 3; o++) {
  const teams = []
  for (let t = 1; t <= 4; t++) {
    const id = o * 10 + t, members = []
    for (let m = 1; m <= 6; m++) {
      const mid = o * 100 + t * 10 + m
      members.push({ id: mid, name: `member-${mid}`, active: mid % 3 !== 0, score: mid % 5 === 0 ? null : (mid % 7) / 2, role: ROLES[mid % 3] })
    }
    teams.push({ id, name: `team-${id}`, tags: [`a${id}`, `b${id}`], members })
  }
  orgs.set(o, { id: o, name: `org-${o}`, teams })
}

// A selection is a list of { f, alias?, sub?, dir?, type? }; `type` names the object type below it.
const render = (sel) => sel.map(({ f, alias, sub, dir }) => `${alias ? `${alias}: ` : ''}${f}${dir ? ` @${dir}(if: ${dir === 'skip' ? 'true' : 'false'})` : ''}${sub ? ` { ${render(sub)} }` : ''}`).join(' ')
const evaluate = (sel, value, type) => {
  const out = {}
  for (const { f, alias, sub, dir } of sel) {
    if (dir) continue // @skip(if: true) and @include(if: false) both drop the field
    const key = alias ?? f
    if (f === '__typename') out[key] = type
    else if (f === 'teams') out[key] = value.teams.map((t) => evaluate(sub, t, 'Team'))
    else if (f === 'members') out[key] = value.members.map((m) => evaluate(sub, m, 'Member'))
    else out[key] = value[f]
  }
  return out
}
const make = (i) => {
  const memberFields = ['id', 'name', 'active', 'score', 'role'].filter((_, k) => (i + k) % 3 !== 0)
  const member = memberFields.map((f) => ({ f, alias: f === 'name' && i % 5 === 0 ? 'label' : undefined, dir: f === 'score' && i % 6 === 1 ? 'skip' : undefined }))
  if (i % 4 === 2) member.push({ f: '__typename' })
  const team = [{ f: 'id' }]
  if (i % 2) team.push({ f: 'name' })
  if (i % 3 !== 1 || i % 8 === 7) team.push({ f: 'tags', dir: i % 7 === 3 ? 'include' : undefined })
  if (i % 8 !== 7) team.push({ f: 'members', sub: member })
  if (i % 4 === 2) team.push({ f: '__typename', alias: 'kind' })
  const root = [{ f: 'name' }, { f: 'id', alias: i % 3 === 0 ? 'orgId' : undefined }, { f: 'teams', sub: team }]
  const orgId = i % 11 === 10 ? 9 : 1 + (i % 3)
  const useFragment = i % 4 === 0 && team.some((n) => n.f === 'members')
  let selection = render(root)
  let query
  if (useFragment) {
    const withFragment = root.map((n) => (n.f === 'teams' ? { ...n, sub: team.map((t) => (t.f === 'members' ? { ...t, sub: [{ f: '...MemberFields' }] } : t)) } : n))
    selection = render(withFragment)
    query = `query Org { org(id: ${orgId}) { ${selection} } } fragment MemberFields on Member { ${render(member)} }`
  } else query = `query Org { org(id: ${orgId}) { ${selection} } }`
  const org = orgs.get(orgId)
  return { input: query, expected: { org: org ? evaluate(root, org, 'Org') : null } }
}
export const cases = Array.from({ length: 32 }, (_, i) => make(i))

// The result is the `data` of the response, as the library returns it. Libraries
// build objects of their own kinds (null-prototype objects, ordered maps), so
// the check reads the result back through JSON before comparing. Nothing else
// is relaxed: every key, value and nested list must match, and a response with
// errors cannot match because the adapter raises on it.
export const verifyOne = (i, output) => {
  const { input, expected } = cases[i]
  if (typeof output === 'string') output = JSON.parse(output)
  assert.ok(output && typeof output === 'object', `fixture ${i}: a result object is required`)
  assert.deepEqual(JSON.parse(JSON.stringify(output)), expected, `fixture ${i}: ${input.slice(0, 200)}`)
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const i of cases.keys()) verifyOne(i, outputs[i])
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (value) => Object.keys(value).length
