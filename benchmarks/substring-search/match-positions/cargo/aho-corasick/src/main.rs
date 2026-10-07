use aho_corasick::AhoCorasick;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u32>, String> {
            let text = value["text"].as_str().ok_or("text")?;
            let needle = value["needle"].as_str().ok_or("needle")?;
            let ac = AhoCorasick::new([needle]).map_err(|e| e.to_string())?;
            Ok(ac.find_iter(text).map(|m| m.start() as u32).collect())
        },
        |positions| positions.len() as u32,
        |positions| Value::from(positions.clone()),
    );
}
