#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use oorandom::Rand32;
fn main() {
    bench_harness::operation::run_value(
        |value| {
            let seed = value["seed"].as_u64().expect("seed");
            let count = value["count"].as_u64().expect("count") as usize;
            let min = value["min"].as_i64().expect("min");
            let max = value["max"].as_i64().expect("max");
            // rand_range takes a u32 range only: draw from 0..span and add min.
            let span = (max - min + 1) as u32;
            let mut rng = Rand32::new(seed);
            let mut out = Vec::with_capacity(count);
            for _ in 0..count { out.push(min + rng.rand_range(0..span) as i64); }
            Ok::<Vec<i64>, String>(out)
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
