#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<bool, std::convert::Infallible>(toml::from_str::<toml::Table>(value.as_str().expect("string fixture")).is_ok()),
        |accepted| u32::from(*accepted),
        |accepted| serde_json::Value::Bool(*accepted),
    );
}
