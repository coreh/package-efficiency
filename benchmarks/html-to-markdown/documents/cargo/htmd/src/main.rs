use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |html| htmd::convert(html.as_str().ok_or("html string")?).map_err(|e| e.to_string()),
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
