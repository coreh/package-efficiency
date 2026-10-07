use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<String, Infallible>(bytesize::ByteSize::b(value.as_u64().expect("integer fixture")).to_string()),
        |s| s.len() as u32,
        |s| serde_json::Value::from(s.as_str()),
    );
}
