use futures::stream::{self, StreamExt};
use serde_json::{Value, json};
use std::cell::Cell;
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Jobs {
    values: Vec<u64>,
    limit: usize,
}

async fn operation(input: &'static Jobs) -> Result<(Vec<u64>, usize), Infallible> {
    let (active, peak) = (Cell::new(0usize), Cell::new(0usize));
    let job = |value: u64| {
        let (active, peak) = (&active, &peak);
        async move {
            active.set(active.get() + 1);
            peak.set(peak.get().max(active.get()));
            bench_harness::async_operation::yield_now().await;
            active.set(active.get() - 1);
            value * 2 + 1
        }
    };
    // `buffered` keeps up to `limit` futures in flight and yields their
    // results in input order.
    let results = stream::iter(input.values.iter().copied()).map(job).buffered(input.limit).collect::<Vec<u64>>().await;
    Ok((results, peak.get()))
}

fn main() {
    bench_harness::async_operation::run(
        |main| futures::executor::block_on(main),
        |input: &Value| Jobs {
            values: input["values"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap()).collect(),
            limit: input["limit"].as_u64().unwrap() as usize,
        },
        operation,
        |(results, peak)| (results.len() + peak) as u32,
        |_, (results, peak)| json!({ "results": results, "peak": peak }),
    );
}
