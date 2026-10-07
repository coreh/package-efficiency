#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let from = value[0].as_str().expect("string fixture");
        let to = value[1].as_str().expect("string fixture");
        Ok(relative_path::RelativePath::new(from).relative(to).into_string())
    });
}
