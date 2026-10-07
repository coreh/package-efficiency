use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<u32, std::convert::Infallible>(crc32fast::hash(value.as_str().expect("string fixture").as_bytes())),
        |sum| *sum & 0xffff,
        |sum| json!(sum),
    );
}
