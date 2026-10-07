use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| json5::from_str::<Value>(value.as_str().expect("string fixture")),
        |parsed| match parsed {
            Value::Object(map) => map.len() as u32,
            Value::Array(items) => items.len() as u32,
            _ => 0,
        },
        Value::clone,
    );
}
