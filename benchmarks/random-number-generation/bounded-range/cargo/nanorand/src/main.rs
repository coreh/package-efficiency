#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use nanorand::{Rng, WyRand};
fn main() {
    bench_harness::operation::run_value(
        |value| {
            let seed = value["seed"].as_u64().expect("seed");
            let count = value["count"].as_u64().expect("count") as usize;
            let min = value["min"].as_i64().expect("min");
            let max = value["max"].as_i64().expect("max");
            let mut rng = WyRand::new_seed(seed);
            let mut out = Vec::with_capacity(count);
            for _ in 0..count { out.push(rng.generate_range(min..=max)); }
            Ok::<Vec<i64>, String>(out)
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
