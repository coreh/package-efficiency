require 'graphql'

ROLES = %w[ADMIN EDITOR VIEWER].freeze
ORGS = {}
(1..3).each do |o|
  teams = (1..4).map do |t|
    tid = o * 10 + t
    members = (1..6).map do |m|
      mid = o * 100 + t * 10 + m
      { id: mid, name: "member-#{mid}", active: mid % 3 != 0, score: mid % 5 == 0 ? nil : (mid % 7) / 2.0, role: ROLES[mid % 3] }
    end
    { id: tid, name: "team-#{tid}", tags: ["a#{tid}", "b#{tid}"], members: members }
  end
  ORGS[o] = { id: o, name: "org-#{o}", teams: teams }
end

class RoleType < GraphQL::Schema::Enum
  graphql_name 'Role'
  value 'ADMIN'
  value 'EDITOR'
  value 'VIEWER'
end

class MemberType < GraphQL::Schema::Object
  graphql_name 'Member'
  field :id, Integer, null: false
  field :name, String, null: false
  field :active, Boolean, null: false
  field :score, Float, null: true
  field :role, RoleType, null: false
end

class TeamType < GraphQL::Schema::Object
  graphql_name 'Team'
  field :id, Integer, null: false
  field :name, String, null: false
  field :tags, [String], null: false
  field :members, [MemberType], null: false
end

class OrgType < GraphQL::Schema::Object
  graphql_name 'Org'
  field :id, Integer, null: false
  field :name, String, null: false
  field :teams, [TeamType], null: false
end

class QueryType < GraphQL::Schema::Object
  graphql_name 'Query'
  field :org, OrgType, null: true do
    argument :id, Integer, required: true
  end

  def org(id:)
    ORGS[id]
  end
end

class OrgSchema < GraphQL::Schema
  query QueryType
end

def operation(source)
  result = OrgSchema.execute(source)
  raise result['errors'].inspect if result['errors']
  result['data']
end
