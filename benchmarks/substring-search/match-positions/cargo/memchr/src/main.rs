use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u32>, String> {
            let text = value["text"].as_str().ok_or("text")?.as_bytes();
            let n = value["needle"].as_str().ok_or("needle")?.as_bytes();
            Ok(memchr::memmem::find_iter(text, n).map(|i| i as u32).collect())
        },
        |positions| positions.len() as u32,
        |positions| Value::from(positions.clone()),
    );
}
