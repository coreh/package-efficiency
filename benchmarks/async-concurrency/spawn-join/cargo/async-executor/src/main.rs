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

thread_local! {
    static EXECUTOR: &'static async_executor::LocalExecutor<'static> = Box::leak(Box::new(async_executor::LocalExecutor::new()));
}

async fn operation(input: &'static Load) -> Result<u64, Infallible> {
    let Load { tasks, multiplier, offset, modulus } = *input;
    let executor = EXECUTOR.with(|e| *e);
    let handles: Vec<_> = (0..tasks)
        .map(|i| {
            executor.spawn(async move {
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
    let executor = EXECUTOR.with(|e| *e);
    bench_harness::async_operation::run(|main| futures_lite::future::block_on(executor.run(main)), prepare, operation, |sum| *sum as u32, |_, sum| json!(sum));
}
