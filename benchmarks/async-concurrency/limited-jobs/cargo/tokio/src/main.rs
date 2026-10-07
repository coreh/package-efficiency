use serde_json::{Value, json};
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};
use tokio::sync::Semaphore;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Jobs {
    values: Vec<u64>,
    limit: usize,
}

async fn operation(input: &'static Jobs) -> Result<(Vec<u64>, usize), tokio::task::JoinError> {
    let places = Arc::new(Semaphore::new(input.limit));
    let active = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicUsize::new(0));
    let mut handles = Vec::with_capacity(input.values.len());
    for &value in &input.values {
        // A place is taken before the job is spawned, so no more than `limit`
        // tasks exist at once.
        let place = places.clone().acquire_owned().await.expect("semaphore is never closed");
        let (active, peak) = (active.clone(), peak.clone());
        handles.push(tokio::spawn(async move {
            peak.fetch_max(active.fetch_add(1, Relaxed) + 1, Relaxed);
            tokio::task::yield_now().await;
            active.fetch_sub(1, Relaxed);
            drop(place);
            value * 2 + 1
        }));
    }
    let mut results = Vec::with_capacity(handles.len());
    for handle in handles {
        results.push(handle.await?);
    }
    Ok((results, peak.load(Relaxed)))
}

fn main() {
    // One thread: the jobs interleave on the thread that calls block_on.
    let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    bench_harness::async_operation::run(
        |main| runtime.block_on(main),
        |input: &Value| Jobs {
            values: input["values"].as_array().unwrap().iter().map(|v| v.as_u64().unwrap()).collect(),
            limit: input["limit"].as_u64().unwrap() as usize,
        },
        operation,
        |(results, peak)| (results.len() + peak) as u32,
        |_, (results, peak)| json!({ "results": results, "peak": peak }),
    );
}
