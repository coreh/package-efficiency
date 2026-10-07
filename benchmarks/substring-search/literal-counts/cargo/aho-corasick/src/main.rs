use aho_corasick::AhoCorasick;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u32>, String> {
            let text = value["text"].as_str().ok_or("text")?;
            let needles = value["needles"].as_array().ok_or("needles")?;
            let ac = AhoCorasick::new(needles.iter().map(|n| n.as_str().unwrap())).map_err(|e| e.to_string())?;
            let mut counts = vec![0u32; needles.len()];
            for m in ac.find_overlapping_iter(text) {
                counts[m.pattern().as_usize()] += 1;
            }
            Ok(counts)
        },
        |counts| counts.len() as u32,
        |counts| Value::from(counts.clone()),
    );
}
