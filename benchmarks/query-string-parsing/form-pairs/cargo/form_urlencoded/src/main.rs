use std::collections::HashMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn consume(m: &HashMap<String, String>) -> u32 { m.len() as u32 + 1 }
fn describe(m: &HashMap<String, String>) -> serde_json::Value { serde_json::json!(m) }

fn main() {
    bench_harness::operation::run_value(|value| {
        let input = value.as_str().expect("string fixture");
        let m: HashMap<String, String> = form_urlencoded::parse(input.as_bytes()).into_owned().collect();
        Ok::<_, String>(m)
    }, consume, describe);
}
