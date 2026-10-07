use deadpool::managed::{Manager, Metrics, Pool, RecycleResult};
use serde_json::{Value, json};
use std::convert::Infallible;
use std::sync::Arc;
use std::sync::atomic::{AtomicUsize, Ordering::Relaxed};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Resource {
    uses: u64,
    sum: u64,
}

struct Maker;

impl Manager for Maker {
    type Type = Resource;
    type Error = Infallible;
    async fn create(&self) -> Result<Resource, Infallible> {
        Ok(Resource { uses: 0, sum: 0 })
    }
    async fn recycle(&self, _: &mut Resource, _: &Metrics) -> RecycleResult<Infallible> {
        Ok(())
    }
}

struct Load {
    size: usize,
    callers: u64,
    cycles: u64,
}

async fn operation(input: &'static Load) -> Result<(u64, u64, usize, usize), tokio::task::JoinError> {
    let pool: Pool<Maker> = Pool::builder(Maker).max_size(input.size).build().unwrap();
    let active = Arc::new(AtomicUsize::new(0));
    let peak = Arc::new(AtomicUsize::new(0));
    let handles: Vec<_> = (0..input.callers)
        .map(|c| {
            let (pool, active, peak, cycles) = (pool.clone(), active.clone(), peak.clone(), input.cycles);
            tokio::spawn(async move {
                for j in 0..cycles {
                    let mut resource = pool.get().await.unwrap();
                    peak.fetch_max(active.fetch_add(1, Relaxed) + 1, Relaxed);
                    resource.uses += 1;
                    resource.sum += (c * 31 + j) % 97 + 1;
                    tokio::task::yield_now().await;
                    active.fetch_sub(1, Relaxed);
                }
            })
        })
        .collect();
    for handle in handles {
        handle.await?;
    }
    // Check out the whole pool at once: a resource never returned would block here.
    let mut held = Vec::with_capacity(input.size);
    for _ in 0..input.size {
        held.push(pool.get().await.unwrap());
    }
    let uses = held.iter().map(|r| r.uses).sum();
    let sum = held.iter().map(|r| r.sum).sum();
    Ok((uses, sum, peak.load(Relaxed), held.len()))
}

fn main() {
    let runtime = tokio::runtime::Builder::new_current_thread().build().unwrap();
    bench_harness::async_operation::run(
        |main| runtime.block_on(main),
        |input: &Value| Load {
            size: input["size"].as_u64().unwrap() as usize,
            callers: input["callers"].as_u64().unwrap(),
            cycles: input["cycles"].as_u64().unwrap(),
        },
        operation,
        |(uses, _, peak, drained)| (*uses as usize + peak + drained) as u32,
        |_, (uses, sum, peak, drained)| json!({ "cycles": uses, "checksum": sum, "peak": peak, "drained": drained }),
    );
}
