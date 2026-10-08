use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let text = value.as_str().expect("string fixture");
            Ok::<_, String>(unidecode::unidecode(text))
        },
        |out: &String| out.len() as u32,
        |out| json!(out),
    );
}
