#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use heck::ToLowerCamelCase;
fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        Ok(input.to_lower_camel_case())
    });
}
