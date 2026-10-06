//! An adapter that does nothing: the empty-process baseline for Rust.

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::boot();
    bench_harness::ready(0);
    loop {
        std::thread::park();
    }
}
