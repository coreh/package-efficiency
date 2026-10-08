use rusqlite::{Connection, params};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Item = (i64, String, f64, i64, Option<String>);

fn main() {
    bench_harness::operation::run_prepared(
        |input| {
            input
                .as_array()
                .expect("rows")
                .iter()
                .map(|r| (r[0].as_i64().unwrap(), r[1].as_str().unwrap().to_string(), r[2].as_f64().unwrap(), r[3].as_i64().unwrap(), r[4].as_str().map(str::to_string)))
                .collect::<Vec<Item>>()
        },
        |rows: &Vec<Item>| -> Result<Vec<Item>, rusqlite::Error> {
            let mut db = Connection::open_in_memory()?;
            db.execute("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)", [])?;
            let tx = db.transaction()?;
            {
                let mut insert = tx.prepare("INSERT INTO items (id, name, score, flag, note) VALUES (?1, ?2, ?3, ?4, ?5)")?;
                for r in rows {
                    insert.execute(params![r.0, r.1, r.2, r.3, r.4])?;
                }
            }
            tx.commit()?;
            let out = {
                let mut select = db.prepare("SELECT id, name, score, flag, note FROM items ORDER BY score, id")?;
                select.query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)))?.collect::<Result<Vec<Item>, _>>()?
            };
            Ok(out)
        },
        |out| out.len() as u32,
        |_, out| Value::Array(out.iter().map(|r| json!([r.0, r.1, r.2, r.3, r.4])).collect()),
    );
}
