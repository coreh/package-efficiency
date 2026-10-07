use toml_edit::DocumentMut;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<bool, std::convert::Infallible>(value.as_str().expect("string fixture").parse::<DocumentMut>().is_ok()),
        |accepted| u32::from(*accepted),
        |accepted| serde_json::Value::Bool(*accepted),
    );
}
