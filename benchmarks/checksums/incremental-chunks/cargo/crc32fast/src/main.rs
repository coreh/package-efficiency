use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut hasher = crc32fast::Hasher::new();
            for chunk in value.as_array().expect("array fixture") {
                hasher.update(chunk.as_str().expect("string chunk").as_bytes());
            }
            Ok::<u32, std::convert::Infallible>(hasher.finalize())
        },
        |sum| *sum & 0xffff,
        |sum| json!(sum),
    );
}
