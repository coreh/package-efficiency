use serde_json::{Value, json};

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

async fn operation(input: &'static Load) -> Result<u64, tokio::task::JoinError> {
    let Load { tasks, multiplier, offset, modulus } = *input;
    let handles: Vec<_> = (0..tasks)
        .map(|i| {
            tokio::spawn(async move {
                tokio::task::yield_now().await;
                (i * multiplier + offset) % modulus
            })
        })
        .collect();
    let mut sum = 0;
    for handle in handles {
        sum += handle.await?;
    }
    Ok(sum)
}

fn main() {
    let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    bench_harness::async_operation::run(|main| runtime.block_on(main), prepare, operation, |sum| *sum as u32, |_, sum| json!(sum));
}
