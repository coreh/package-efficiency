use tiny_keccak::{Hasher, Sha3};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let input = value.as_str().expect("string fixture");
            let mut hasher = Sha3::v256();
            hasher.update(input.as_bytes());
            let mut out = [0u8; 32];
            hasher.finalize(&mut out);
            Ok::<_, std::convert::Infallible>(out)
        },
        |digest| digest.len() as u32,
        |digest| serde_json::json!(digest.iter().collect::<Vec<_>>()),
    );
}
