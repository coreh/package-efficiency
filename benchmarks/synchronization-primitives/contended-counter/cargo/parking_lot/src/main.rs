use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    threads: u64,
    turns: u64,
}

struct Counted {
    count: u64,
    sum: u64,
}

fn operation(input: &Load) -> Result<Counted, Infallible> {
    let counter = parking_lot::Mutex::new(0u64);
    let sums: Vec<u64> = std::thread::scope(|scope| {
        let handles: Vec<_> = (0..input.threads)
            .map(|_| {
                scope.spawn(|| {
                    let mut mine = 0u64;
                    for _ in 0..input.turns {
                        let ticket = {
                            let mut guard = counter.lock();
                            let ticket = *guard;
                            *guard = ticket + 1;
                            ticket
                        };
                        mine += ticket;
                    }
                    mine
                })
            })
            .collect();
        handles.into_iter().map(|h| h.join().unwrap()).collect()
    });
    let count = *counter.lock();
    Ok(Counted { count, sum: sums.iter().sum() })
}

fn main() {
    // A blocking operation: it starts its threads and joins them.
    bench_harness::operation::run_prepared(
        |input: &Value| Load { threads: input["threads"].as_u64().unwrap(), turns: input["turns"].as_u64().unwrap() },
        operation,
        |counted| counted.count as u32,
        |_, counted| json!({ "count": counted.count, "sum": counted.sum }),
    );
}
