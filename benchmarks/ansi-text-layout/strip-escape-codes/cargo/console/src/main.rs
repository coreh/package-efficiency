#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_borrowed_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        Ok(console::strip_ansi_codes(input))
    });
}
