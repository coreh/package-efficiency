#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn consume(line: &String) -> u32 { line.len() as u32 }
fn describe(line: &String) -> serde_json::Value { serde_json::json!(line) }

fn main() {
    bench_harness::operation::run_value(|value| {
        let words = value["words"].as_array().expect("words array");
        Ok::<String, String>(shell_words::join(words.iter().map(|w| w.as_str().expect("word string"))))
    }, consume, describe);
}
