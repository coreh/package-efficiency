use multimap::MultiMap;
use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    keys: Vec<&'static str>,
    values: Vec<&'static str>,
    remove: Vec<&'static str>,
    read: Vec<&'static str>,
}

// The run_prepared hook gives a short-lived &Value, so each string is copied
// once and leaked: it lives as long as the fixtures do, and the map then
// borrows it with no copy inside the call.
fn strs(v: &Value) -> Vec<&'static str> {
    v.as_array().expect("array").iter().map(|s| &*Box::leak(s.as_str().expect("string").to_owned().into_boxed_str())).collect()
}

// Untimed, once per fixture: the JSON lists become vectors of borrowed strings.
fn prepare(v: &Value) -> Input {
    Input { keys: strs(&v["keys"]), values: strs(&v["values"]), remove: strs(&v["remove"]), read: strs(&v["read"]) }
}

fn operation(input: &Input) -> Result<Vec<Vec<&'static str>>, std::convert::Infallible> {
    let mut map: MultiMap<&str, &str> = MultiMap::new();
    for (k, v) in input.keys.iter().zip(input.values.iter()) {
        map.insert(*k, *v);
    }
    for k in &input.remove {
        map.remove(k);
    }
    Ok(input.read.iter().map(|k| map.get_vec(k).map(|v| v.clone()).unwrap_or_default()).collect())
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        operation,
        |r| r.len() as u32,
        |_, r| json!(r),
    );
}

