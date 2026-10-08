use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let bpe = bpe_openai::cl100k_base();
    bench_harness::operation::run_value(
        |input: &Value| {
            let ids = bpe.encode(input.as_str().expect("text"));
            let text = bpe.decode(&ids).ok_or("ids do not decode")?;
            Ok::<_, String>((ids, text))
        },
        |out| out.0.len() as u32,
        |out| serde_json::json!({ "ids": out.0, "text": out.1 }),
    );
}
