use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let domain = value.as_str().expect("string fixture");
            idna::domain_to_ascii(domain).map_err(|e| e.to_string())
        },
        |ascii| ascii.len() as u32,
        |ascii| json!(ascii),
    );
}
