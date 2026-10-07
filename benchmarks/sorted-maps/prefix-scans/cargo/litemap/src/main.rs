use litemap::LiteMap;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Result = (Vec<Option<u32>>, Vec<Vec<u32>>);

fn operation(input: &Value) -> std::result::Result<Result, String> {
    let keys = input["keys"].as_array().ok_or("keys")?;
    let mut map: LiteMap<&str, u32> = LiteMap::new();
    for (value, key) in keys.iter().enumerate() {
        map.insert(key.as_str().ok_or("key")?, value as u32);
    }
    let found = input["lookups"].as_array().ok_or("lookups")?.iter()
        .map(|key| map.get(key.as_str().unwrap()).copied())
        .collect();
    let scans = input["prefixes"].as_array().ok_or("prefixes")?.iter()
        .map(|prefix| {
            let prefix = prefix.as_str().unwrap();
            let start = match map.find_index(prefix) { Ok(i) | Err(i) => i };
            let mut values = Vec::new();
            for i in start..map.len() {
                let (key, value) = map.get_indexed(i).unwrap();
                if !key.starts_with(prefix) { break; }
                values.push(*value);
            }
            values
        })
        .collect();
    Ok((found, scans))
}

fn main() {
    bench_harness::operation::run_value(
        operation,
        |(found, scans)| (found.len() + scans.len()) as u32,
        |(found, scans)| json!([found, scans]),
    );
}
