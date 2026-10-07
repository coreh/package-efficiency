#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<_, std::convert::Infallible>(mime_guess::get_mime_extensions_str(value.as_str().expect("string fixture")).and_then(|exts| exts.first().copied()).unwrap_or("")),
        |ext| ext.len() as u32,
        |ext| serde_json::Value::from(*ext),
    );
}
