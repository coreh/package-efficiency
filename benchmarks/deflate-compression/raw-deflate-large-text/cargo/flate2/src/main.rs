use std::io::Read;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let mut packed = Vec::new();
            flate2::read::DeflateEncoder::new(input, flate2::Compression::default()).read_to_end(&mut packed)?;
            Ok(packed)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): the bytes as a list of integers.
        |packed| serde_json::json!(packed),
    );
}
