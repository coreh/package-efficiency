use futures::future::join_all;
use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    tasks: u64,
    turns: u64,
}

async fn operation(input: &'static Load) -> Result<(u64, u64), Infallible> {
    let turns = input.turns;
    let mutex = async_lock::Mutex::new(0u64);
    let mutex = &mutex;
    let sums = join_all((0..input.tasks).map(|_| async move {
        let mut mine = 0u64;
        for _ in 0..turns {
            let mut guard = mutex.lock().await;
            let ticket = *guard;
            bench_harness::async_operation::yield_now().await;
            *guard = ticket + 1;
            drop(guard);
            mine += ticket;
        }
        mine
    }))
    .await;
    let count = *mutex.lock().await;
    Ok((count, sums.iter().sum()))
}

fn main() {
    bench_harness::async_operation::run(
        |main| futures::executor::block_on(main),
        |input: &Value| Load { tasks: input["tasks"].as_u64().unwrap(), turns: input["turns"].as_u64().unwrap() },
        operation,
        |(count, sum)| (*count ^ *sum) as u32,
        |_, (count, sum)| json!({ "count": count, "sum": sum }),
    );
}
