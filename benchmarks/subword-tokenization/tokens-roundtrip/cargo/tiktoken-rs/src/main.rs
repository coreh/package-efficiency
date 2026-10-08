use serde_json::Value;
use tiktoken_rs::cl100k_base_singleton;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let bpe = cl100k_base_singleton();
    bench_harness::operation::run_value(
        |input: &Value| {
            let ids = bpe.encode_with_special_tokens(input.as_str().expect("text"));
            let text = bpe.decode(ids.clone()).map_err(|e| e.to_string())?;
            Ok::<_, String>((ids, text))
        },
        |out| out.0.len() as u32,
        |out| serde_json::json!({ "ids": out.0, "text": out.1 }),
    );
}
