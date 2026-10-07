use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Load {
    producers: u64,
    messages: u64,
    capacity: usize,
}

struct Received {
    count: u64,
    sum: u64,
    ordered: bool,
}

fn operation(input: &Load) -> Result<Received, Infallible> {
    let (sender, receiver) = flume::bounded::<u64>(input.capacity);
    let (producers, messages) = (input.producers, input.messages);
    Ok(std::thread::scope(|scope| {
        for p in 0..producers {
            let sender = sender.clone();
            scope.spawn(move || {
                for i in 0..messages {
                    sender.send(i * producers + p).unwrap();
                }
            });
        }
        let mut next = vec![0u64; producers as usize];
        let mut received = Received { count: 0, sum: 0, ordered: true };
        for _ in 0..producers * messages {
            let value = receiver.recv().unwrap();
            let p = (value % producers) as usize;
            if value / producers != next[p] {
                received.ordered = false;
            }
            next[p] += 1;
            received.sum += value;
            received.count += 1;
        }
        // The scope joins the producers before it returns.
        received
    }))
}

fn main() {
    // A blocking operation: it starts its threads and joins them, so it is a
    // synchronous call for the harness.
    bench_harness::operation::run_prepared(
        |input: &Value| Load {
            producers: input["producers"].as_u64().unwrap(),
            messages: input["messages"].as_u64().unwrap(),
            capacity: input["capacity"].as_u64().unwrap() as usize,
        },
        operation,
        |received| received.count as u32,
        |_, received| json!({ "count": received.count, "sum": received.sum, "ordered": received.ordered }),
    );
}
