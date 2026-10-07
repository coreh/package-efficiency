#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<_, std::convert::Infallible>(mime_guess::from_path(value.as_str().expect("string fixture")).first_raw().unwrap_or("")),
        |mime| mime.len() as u32,
        |mime| serde_json::Value::from(*mime),
    );
}
