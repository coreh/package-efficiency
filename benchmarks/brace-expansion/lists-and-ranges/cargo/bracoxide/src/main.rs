#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| bracoxide::explode(value.as_str().expect("string fixture")).map_err(|e| e.to_string()),
        |list: &Vec<String>| list.len() as u32,
        |list| serde_json::json!(list),
    );
}
