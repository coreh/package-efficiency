import { buildSchema, graphqlSync } from 'graphql'
const schema = buildSchema(`
  type Query { org(id: Int!): Org }
  type Org { id: Int!, name: String!, teams: [Team!]! }
  type Team { id: Int!, name: String!, tags: [String!]!, members: [Member!]! }
  type Member { id: Int!, name: String!, active: Boolean!, score: Float, role: Role! }
  enum Role { ADMIN EDITOR VIEWER }
`)
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
const rootValue = { org: ({ id }) => orgs.get(id) ?? null }
export const operation = (source) => {
  const result = graphqlSync({ schema, source, rootValue })
  if (result.errors) throw new Error(result.errors[0].message)
  return result.data
}
