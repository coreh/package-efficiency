#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run(|value| {
        let mut sorted = value.clone();
        sorted.sort_all_objects();
        serde_json::to_string(&sorted)
    });
}
