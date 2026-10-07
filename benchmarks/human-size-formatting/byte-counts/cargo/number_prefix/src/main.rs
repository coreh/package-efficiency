use number_prefix::NumberPrefix;
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let n = value.as_u64().expect("integer fixture");
            Ok::<String, Infallible>(match NumberPrefix::binary(n as f64) {
                NumberPrefix::Standalone(b) => format!("{} B", b),
                NumberPrefix::Prefixed(prefix, v) => format!("{:.1} {}B", v, prefix),
            })
        },
        |s| s.len() as u32,
        |s| serde_json::Value::from(s.as_str()),
    );
}
