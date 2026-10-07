#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn consume(words: &Vec<String>) -> u32 { words.len() as u32 }
fn describe(words: &Vec<String>) -> serde_json::Value { serde_json::json!(words) }

fn main() {
    bench_harness::operation::run_value(|value| {
        let line = value["line"].as_str().expect("line string");
        shell_words::split(line)
    }, consume, describe);
}
