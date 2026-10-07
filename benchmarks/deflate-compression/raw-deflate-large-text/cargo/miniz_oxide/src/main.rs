#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            Ok(miniz_oxide::deflate::compress_to_vec(input, 6))
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): the bytes as a list of integers.
        |packed| serde_json::json!(packed),
    );
}
