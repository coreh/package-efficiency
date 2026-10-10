use futures::future::join_all;
use futures_intrusive::buffer::{RealArray, RingBuf, ArrayBuf};
use futures_intrusive::channel::LocalChannel;
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

// LocalChannel's buffer is a fixed array, so its length is a type: one
// instantiation per capacity of the task.
async fn run<A>(producers: u64, messages: u64) -> Received
where
    A: RealArray<u64> + AsMut<[u64]> + AsRef<[u64]> + 'static,
    ArrayBuf<u64, A>: RingBuf<Item = u64>,
{
    let channel: LocalChannel<u64, A> = LocalChannel::new();
    let channel = &channel;
    let sending = join_all((0..producers).map(|p| async move {
        for i in 0..messages {
            channel.send(i * producers + p).await.unwrap();
        }
    }));
    let receiving = async {
        let mut next = vec![0u64; producers as usize];
        let mut received = Received { count: 0, sum: 0, ordered: true };
        for _ in 0..producers * messages {
            let value = channel.receive().await.unwrap();
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
    received
}

async fn operation(input: &'static Load) -> Result<Received, Infallible> {
    let (producers, messages) = (input.producers, input.messages);
    Ok(match input.capacity {
        16 => run::<[u64; 16]>(producers, messages).await,
        64 => run::<[u64; 64]>(producers, messages).await,
        1024 => run::<[u64; 1024]>(producers, messages).await,
        other => panic!("no array type for capacity {other}"),
    })
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
