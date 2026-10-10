use serde_json::{Value, json};
use std::convert::Infallible;
use std::sync::Arc;
use std::sync::mpsc::channel;
use threadpool::ThreadPool;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    threads: usize,
    seeds: Arc<Vec<u32>>,
    rounds: Arc<Vec<u32>>,
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
    let pool = ThreadPool::new(input.threads);
    let n = input.seeds.len();
    let (sender, receiver) = channel::<(usize, u32)>();
    for i in 0..n {
        let (sender, seeds, rounds) = (sender.clone(), Arc::clone(&input.seeds), Arc::clone(&input.rounds));
        pool.execute(move || {
            sender.send((i, job(seeds[i], rounds[i]))).unwrap();
        });
    }
    drop(sender);
    let mut results = vec![0u32; n];
    for (i, value) in receiver.iter().take(n) {
        results[i] = value;
    }
    pool.join();
    Ok(results)
}

fn main() {
    bench_harness::operation::run_prepared(
        |input: &Value| Load {
            threads: input["threads"].as_u64().unwrap() as usize,
            seeds: Arc::new(input["seeds"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap() as u32).collect()),
            rounds: Arc::new(input["rounds"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap() as u32).collect()),
        },
        operation,
        |results| results.len() as u32,
        |_, results| json!(results),
    );
}
