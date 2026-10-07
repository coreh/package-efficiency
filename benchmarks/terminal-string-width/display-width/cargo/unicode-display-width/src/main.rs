#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<u64, std::convert::Infallible>(unicode_display_width::width(value.as_str().expect("string fixture"))),
        |width| *width as u32,
        |width| serde_json::json!(width),
    );
}
