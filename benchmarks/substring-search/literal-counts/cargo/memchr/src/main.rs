use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u32>, String> {
            let text = value["text"].as_str().ok_or("text")?.as_bytes();
            let needles = value["needles"].as_array().ok_or("needles")?;
            Ok(needles
                .iter()
                .map(|n| {
                    let n = n.as_str().unwrap().as_bytes();
                    if n.len() == 1 {
                        memchr::memchr_iter(n[0], text).count() as u32
                    } else {
                        memchr::memmem::find_iter(text, n).count() as u32
                    }
                })
                .collect())
        },
        |counts| counts.len() as u32,
        |counts| Value::from(counts.clone()),
    );
}
