use serde_json::Value;
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<_, Infallible>(serde_json::from_str::<Value>(value.as_str().expect("string fixture")).ok()),
        |parsed| parsed.as_ref().map_or(0, |_| 1),
        |parsed| parsed.clone().unwrap_or(Value::Null),
    );
}
