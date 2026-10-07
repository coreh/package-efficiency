//! An adapter that does nothing, run through the same fixtures and rounds as
//! a real one: the warm baseline for Rust operation tasks.

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(|_| Ok::<(), std::convert::Infallible>(()), |_| 1, |_| serde_json::Value::Null);
}
