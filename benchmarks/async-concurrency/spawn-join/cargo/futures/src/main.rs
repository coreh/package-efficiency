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
    static SPAWNER: std::cell::OnceCell<futures::executor::LocalSpawner> = const { std::cell::OnceCell::new() };
}

async fn operation(input: &'static Load) -> Result<u64, Infallible> {
    use futures::task::LocalSpawnExt;
    let Load { tasks, multiplier, offset, modulus } = *input;
    let spawner = SPAWNER.with(|s| s.get().unwrap().clone());
    let handles: Vec<_> = (0..tasks)
        .map(|i| {
            spawner
                .spawn_local_with_handle(async move {
                    bench_harness::async_operation::yield_now().await;
                    (i * multiplier + offset) % modulus
                })
                .unwrap()
        })
        .collect();
    let mut sum = 0;
    for handle in handles {
        sum += handle.await;
    }
    Ok(sum)
}

fn main() {
    let mut pool = futures::executor::LocalPool::new();
    SPAWNER.with(|s| s.set(pool.spawner()).unwrap());
    bench_harness::async_operation::run(|main| pool.run_until(main), prepare, operation, |sum| *sum as u32, |_, sum| json!(sum));
}
