use sha3::{Digest, Sha3_256};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let input = value.as_str().expect("string fixture");
            Ok::<_, std::convert::Infallible>(Sha3_256::digest(input.as_bytes()))
        },
        |digest| digest.len() as u32,
        |digest| serde_json::json!(digest.iter().collect::<Vec<_>>()),
    );
}
