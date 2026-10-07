use std::collections::HashMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn consume(m: &HashMap<String, String>) -> u32 { m.len() as u32 + 1 }
fn describe(m: &HashMap<String, String>) -> serde_json::Value { serde_json::json!(m) }

fn main() {
    bench_harness::operation::run_value(|value| {
        let input = value.as_str().expect("string fixture");
        serde_urlencoded::from_str::<HashMap<String, String>>(input).map_err(|e| e.to_string())
    }, consume, describe);
}
