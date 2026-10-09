#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use rand_pcg::Pcg32;
use rand_core::{Rng, SeedableRng};
fn main() {
    bench_harness::operation::run_value(
        |value| {
            let seed = value["seed"].as_u64().expect("seed");
            let count = value["count"].as_u64().expect("count") as usize;
            let mut rng = Pcg32::seed_from_u64(seed);
            let mut out = Vec::with_capacity(count);
            for _ in 0..count { out.push(rng.next_u32()); }
            Ok::<Vec<u32>, String>(out)
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
