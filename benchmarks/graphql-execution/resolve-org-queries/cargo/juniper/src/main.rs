use juniper::{EmptyMutation, EmptySubscription, GraphQLEnum, GraphQLObject, RootNode, Value, Variables, graphql_object};
use serde_json::Value as Json;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(GraphQLEnum, Clone, Copy)]
enum Role {
    Admin,
    Editor,
    Viewer,
}

#[derive(GraphQLObject)]
struct Member {
    id: i32,
    name: String,
    active: bool,
    score: Option<f64>,
    role: Role,
}

#[derive(GraphQLObject)]
struct Team {
    id: i32,
    name: String,
    tags: Vec<String>,
    members: Vec<Member>,
}

#[derive(GraphQLObject)]
struct Org {
    id: i32,
    name: String,
    teams: Vec<Team>,
}

struct Query {
    orgs: Vec<Org>,
}

#[graphql_object]
impl Query {
    fn org(&self, id: i32) -> Option<&Org> {
        self.orgs.iter().find(|org| org.id == id)
    }
}

type Schema = RootNode<'static, Query, EmptyMutation<()>, EmptySubscription<()>>;

fn build() -> Schema {
    let roles = [Role::Admin, Role::Editor, Role::Viewer];
    let orgs = (1..=3)
        .map(|o| Org {
            id: o,
            name: format!("org-{o}"),
            teams: (1..=4)
                .map(|t| {
                    let tid = o * 10 + t;
                    Team {
                        id: tid,
                        name: format!("team-{tid}"),
                        tags: vec![format!("a{tid}"), format!("b{tid}")],
                        members: (1..=6)
                            .map(|m| {
                                let mid = o * 100 + t * 10 + m;
                                Member {
                                    id: mid,
                                    name: format!("member-{mid}"),
                                    active: mid % 3 != 0,
                                    score: if mid % 5 == 0 { None } else { Some((mid % 7) as f64 / 2.0) },
                                    role: roles[(mid % 3) as usize],
                                }
                            })
                            .collect(),
                    }
                })
                .collect(),
        })
        .collect();
    RootNode::new(Query { orgs }, EmptyMutation::new(), EmptySubscription::new())
}

fn main() {
    let schema = build();
    bench_harness::operation::run_value(
        |input| {
            let source = input.as_str().ok_or("string fixture")?;
            let (data, errors) = juniper::execute_sync(source, None, &schema, &Variables::new(), &()).map_err(|e| e.to_string())?;
            if let Some(error) = errors.first() {
                return Err(format!("{:?}", error.error()));
            }
            Ok(data)
        },
        |data: &Value| data.as_object_value().map_or(1, |object| object.field_count() as u32),
        |data| serde_json::to_value(data).unwrap_or(Json::Null),
    );
}
