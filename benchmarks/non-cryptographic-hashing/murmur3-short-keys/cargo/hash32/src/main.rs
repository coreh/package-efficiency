use hash32::{Hasher, Murmur3Hasher};
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut hasher = Murmur3Hasher::default();
            std::hash::Hasher::write(&mut hasher, value.as_str().expect("string fixture").as_bytes());
            Ok::<u32, std::convert::Infallible>(hasher.finish32())
        },
        |hash| *hash & 0xffff,
        |hash| json!(hash),
    );
}
