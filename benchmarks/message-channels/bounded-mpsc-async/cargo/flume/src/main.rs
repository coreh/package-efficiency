use futures::future::join_all;
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
    let (sender, receiver) = flume::bounded::<u64>(input.capacity);
    let sending = join_all((0..producers).map(|p| {
        let sender = sender.clone();
        async move {
            for i in 0..messages {
                sender.send_async(i * producers + p).await.unwrap();
            }
        }
    }));
    let receiving = async {
        let mut next = vec![0u64; producers as usize];
        let mut received = Received { count: 0, sum: 0, ordered: true };
        for _ in 0..producers * messages {
            let value = receiver.recv_async().await.unwrap();
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
