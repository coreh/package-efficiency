use unicode_width::UnicodeWidthStr;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<usize, std::convert::Infallible>(value.as_str().expect("string fixture").width()),
        |width| *width as u32,
        |width| serde_json::json!(width),
    );
}
