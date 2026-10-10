use futures::channel::mpsc;
use futures::future::join_all;
use futures::{SinkExt, StreamExt};
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

async fn operation(input: &'static Load) -> Result<Received, Infallible> {
    let (producers, messages) = (input.producers, input.messages);
    // The channel holds `buffer` plus one slot per Sender: one clone per
    // producer, the original dropped, buffer = capacity - producers.
    let (sender, mut receiver) = mpsc::channel::<u64>(input.capacity - producers as usize);
    let senders: Vec<_> = (0..producers).map(|_| sender.clone()).collect();
    drop(sender);
    let sending = join_all(senders.into_iter().enumerate().map(|(p, mut sender)| async move {
        let p = p as u64;
        for i in 0..messages {
            sender.send(i * producers + p).await.unwrap();
        }
    }));
    let receiving = async {
        let mut next = vec![0u64; producers as usize];
        let mut received = Received { count: 0, sum: 0, ordered: true };
        for _ in 0..producers * messages {
            let value = receiver.next().await.unwrap();
            let p = (value % producers) as usize;
            if value / producers != next[p] {
                received.ordered = false;
            }
            next[p] += 1;
            received.sum += value;
            received.count += 1;
        }
        received
    };
    let (_, received) = futures::join!(sending, receiving);
    Ok(received)
}

fn main() {
    bench_harness::async_operation::run(
        |main| futures::executor::block_on(main),
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
