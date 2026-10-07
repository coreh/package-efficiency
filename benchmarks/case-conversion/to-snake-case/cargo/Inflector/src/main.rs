#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;
use inflector::cases::snakecase::to_snake_case;
fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        Ok(to_snake_case(input))
    });
}
