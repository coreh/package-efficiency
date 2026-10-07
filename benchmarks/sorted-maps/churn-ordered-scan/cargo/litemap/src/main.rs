use litemap::LiteMap;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Result = (Vec<bool>, Vec<u32>);

fn operation(input: &Value) -> std::result::Result<Result, String> {
    let keys = input["keys"].as_array().ok_or("keys")?;
    let mut map: LiteMap<&str, u32> = LiteMap::new();
    for (value, key) in keys.iter().enumerate() {
        map.insert(key.as_str().ok_or("key")?, value as u32);
    }
    let removed = input["removals"].as_array().ok_or("removals")?.iter()
        .map(|key| map.remove(key.as_str().unwrap()).is_some())
        .collect();
    let ordered = map.values().copied().collect();
    Ok((removed, ordered))
}

fn main() {
    bench_harness::operation::run_value(
        operation,
        |(removed, ordered)| (removed.len() + ordered.len()) as u32,
        |(removed, ordered)| json!([removed, ordered]),
    );
}
