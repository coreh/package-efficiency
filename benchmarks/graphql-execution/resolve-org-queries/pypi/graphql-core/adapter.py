from graphql import build_schema, graphql_sync

schema = build_schema("""
  type Query { org(id: Int!): Org }
  type Org { id: Int!, name: String!, teams: [Team!]! }
  type Team { id: Int!, name: String!, tags: [String!]!, members: [Member!]! }
  type Member { id: Int!, name: String!, active: Boolean!, score: Float, role: Role! }
  enum Role { ADMIN EDITOR VIEWER }
""")
ROLES = ['ADMIN', 'EDITOR', 'VIEWER']
orgs = {}
for o in range(1, 4):
    teams = []
    for t in range(1, 5):
        tid = o * 10 + t
        members = []
        for m in range(1, 7):
            mid = o * 100 + t * 10 + m
            members.append({'id': mid, 'name': 'member-%d' % mid, 'active': mid % 3 != 0,
                            'score': None if mid % 5 == 0 else (mid % 7) / 2, 'role': ROLES[mid % 3]})
        teams.append({'id': tid, 'name': 'team-%d' % tid, 'tags': ['a%d' % tid, 'b%d' % tid], 'members': members})
    orgs[o] = {'id': o, 'name': 'org-%d' % o, 'teams': teams}

root_value = {'org': lambda info, id: orgs.get(id)}


def operation(source):
    result = graphql_sync(schema, source, root_value=root_value)
    if result.errors:
        raise RuntimeError(str(result.errors[0]))
    return result.data
