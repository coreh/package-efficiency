use serde_yaml::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| serde_yaml::from_str::<Value>(value.as_str().expect("string fixture")),
        |parsed| match parsed {
            Value::Mapping(map) => map.len() as u32,
            Value::Sequence(items) => items.len() as u32,
            _ => 0,
        },
        |parsed| serde_json::to_value(parsed).expect("JSON-compatible document"),
    );
}
