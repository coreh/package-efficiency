use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    tasks: u64,
    multiplier: u64,
    offset: u64,
    modulus: u64,
}

fn prepare(input: &Value) -> Load {
    Load {
        tasks: input["tasks"].as_u64().unwrap(),
        multiplier: input["multiplier"].as_u64().unwrap(),
        offset: input["offset"].as_u64().unwrap(),
        modulus: input["modulus"].as_u64().unwrap(),
    }
}

async fn operation(input: &'static Load) -> Result<u64, Infallible> {
    let Load { tasks, multiplier, offset, modulus } = *input;
    let handles: Vec<_> = (0..tasks)
        .map(|i| {
            async_global_executor::spawn_local(async move {
                bench_harness::async_operation::yield_now().await;
                (i * multiplier + offset) % modulus
            })
        })
        .collect();
    let mut sum = 0;
    for handle in handles {
        sum += handle.await;
    }
    Ok(sum)
}

fn main() {
    bench_harness::async_operation::run(|main| async_global_executor::block_on(main), prepare, operation, |sum| *sum as u32, |_, sum| json!(sum));
}
