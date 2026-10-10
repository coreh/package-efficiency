use rayon::prelude::*;
use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    threads: usize,
    seeds: Vec<u32>,
    rounds: Vec<u32>,
}

fn job(seed: u32, rounds: u32) -> u32 {
    let mut x = seed;
    for _ in 0..rounds {
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
    }
    x
}

fn operation(input: &Load) -> Result<Vec<u32>, Infallible> {
    let pool = rayon::ThreadPoolBuilder::new().num_threads(input.threads).build().unwrap();
    Ok(pool.install(|| {
        input.seeds.par_iter().zip(&input.rounds).map(|(&s, &r)| job(s, r)).collect::<Vec<u32>>()
    }))
}

fn main() {
    bench_harness::operation::run_prepared(
        |input: &Value| Load {
            threads: input["threads"].as_u64().unwrap() as usize,
            seeds: input["seeds"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap() as u32).collect(),
            rounds: input["rounds"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap() as u32).collect(),
        },
        operation,
        |results| results.len() as u32,
        |_, results| json!(results),
    );
}
