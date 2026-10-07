#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|_| {
        Ok(uuid::Uuid::new_v4().to_string())
    });
}
