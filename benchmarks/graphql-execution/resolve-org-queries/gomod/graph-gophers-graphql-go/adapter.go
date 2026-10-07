package main

import (
	"context"
	"fmt"

	graphql "github.com/graph-gophers/graphql-go"
)

const sdl = `
  schema { query: Query }
  type Query { org(id: Int!): Org }
  type Org { id: Int!, name: String!, teams: [Team!]! }
  type Team { id: Int!, name: String!, tags: [String!]!, members: [Member!]! }
  type Member { id: Int!, name: String!, active: Boolean!, score: Float, role: Role! }
  enum Role { ADMIN EDITOR VIEWER }
`

type member struct {
	id     int32
	name   string
	active bool
	score  *float64
	role   string
}
type team struct {
	id      int32
	name    string
	tags    []string
	members []*member
}
type org struct {
	id    int32
	name  string
	teams []*team
}

func (m *member) ID() int32       { return m.id }
func (m *member) Name() string    { return m.name }
func (m *member) Active() bool    { return m.active }
func (m *member) Score() *float64 { return m.score }
func (m *member) Role() string    { return m.role }

func (t *team) ID() int32          { return t.id }
func (t *team) Name() string       { return t.name }
func (t *team) Tags() []string     { return t.tags }
func (t *team) Members() []*member { return t.members }

func (o *org) ID() int32      { return o.id }
func (o *org) Name() string   { return o.name }
func (o *org) Teams() []*team { return o.teams }

type root struct{ orgs map[int32]*org }

func (r *root) Org(args struct{ ID int32 }) *org { return r.orgs[args.ID] }

var roles = []string{"ADMIN", "EDITOR", "VIEWER"}
var schema = build()

func build() *graphql.Schema {
	r := &root{orgs: map[int32]*org{}}
	for o := int32(1); o <= 3; o++ {
		teams := []*team{}
		for t := int32(1); t <= 4; t++ {
			tid := o*10 + t
			members := []*member{}
			for m := int32(1); m <= 6; m++ {
				mid := o*100 + t*10 + m
				var score *float64
				if mid%5 != 0 {
					s := float64(mid%7) / 2
					score = &s
				}
				members = append(members, &member{id: mid, name: fmt.Sprintf("member-%d", mid), active: mid%3 != 0, score: score, role: roles[mid%3]})
			}
			teams = append(teams, &team{id: tid, name: fmt.Sprintf("team-%d", tid), tags: []string{fmt.Sprintf("a%d", tid), fmt.Sprintf("b%d", tid)}, members: members})
		}
		r.orgs[o] = &org{id: o, name: fmt.Sprintf("org-%d", o), teams: teams}
	}
	return graphql.MustParseSchema(sdl, r)
}

func operation(value any) any {
	resp := schema.Exec(context.Background(), value.(string), "", nil)
	if len(resp.Errors) > 0 {
		panic(resp.Errors[0].Error())
	}
	return resp.Data
}
