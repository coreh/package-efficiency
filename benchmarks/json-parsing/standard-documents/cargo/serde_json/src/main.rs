use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| serde_json::from_str::<Value>(value.as_str().expect("string fixture")),
        |parsed| parsed.as_array().map_or(0, |items| items.len() as u32),
        Value::clone,
    );
}
