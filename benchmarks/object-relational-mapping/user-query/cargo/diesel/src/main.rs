use std::cell::RefCell;

use diesel::prelude::*;
use diesel::sql_query;
use diesel::sqlite::SqliteConnection;
use serde_json::{Value as Json, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

diesel::table! {
    users (id) {
        id -> Integer,
        name -> Text,
        city -> Text,
        age -> Integer,
        score -> Integer,
    }
}

#[derive(Insertable)]
#[diesel(table_name = users)]
struct NewUser<'a> {
    name: &'a str,
    city: &'a str,
    age: i32,
    score: i32,
}

#[derive(Queryable, Selectable)]
#[diesel(table_name = users)]
struct User {
    id: i32,
    name: String,
    city: String,
    age: i32,
    score: i32,
}

// The fixture read into plain values, outside the timed call.
struct Query {
    rows: Vec<(String, String, i32, i32)>,
    skip_city: String,
    min_age: i32,
}

fn prepare(input: &Json) -> Query {
    Query {
        rows: input["rows"].as_array().unwrap().iter().map(|r| (r[0].as_str().unwrap().to_string(), r[1].as_str().unwrap().to_string(), r[2].as_i64().unwrap() as i32, r[3].as_i64().unwrap() as i32)).collect(),
        skip_city: input["skipCity"].as_str().unwrap().to_string(),
        min_age: input["minAge"].as_i64().unwrap() as i32,
    }
}

fn run(conn: &mut SqliteConnection, q: &Query) -> Result<Vec<(i32, String, String, i32, i32)>, diesel::result::Error> {
    sql_query("CREATE TABLE users (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, age INTEGER NOT NULL, score INTEGER NOT NULL)").execute(conn)?;
    let new_users: Vec<NewUser> = q.rows.iter().map(|(name, city, age, score)| NewUser { name, city, age: *age, score: *score }).collect();
    diesel::insert_into(users::table).values(&new_users).execute(conn)?;
    let found: Vec<User> = users::table
        .filter(users::age.ge(q.min_age))
        .filter(users::city.ne(&q.skip_city))
        .order((users::score.desc(), users::id.asc()))
        .select(User::as_select())
        .load(conn)?;
    sql_query("DROP TABLE users").execute(conn)?;
    Ok(found.into_iter().map(|u| (u.id, u.name, u.city, u.age, u.score)).collect())
}

fn main() {
    // The connection (one in-memory database) is opened once; each call
    // creates the table, uses it and drops it.
    let conn = RefCell::new(SqliteConnection::establish(":memory:").unwrap());
    bench_harness::operation::run_prepared(
        prepare,
        |q: &Query| run(&mut conn.borrow_mut(), q),
        |out: &Vec<(i32, String, String, i32, i32)>| out.len() as u32,
        |_, out| Json::Array(out.iter().map(|(id, name, city, age, score)| json!([id, name, city, age, score])).collect()),
    );
}
