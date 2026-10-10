use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let count = input.as_u64().expect("count") as usize;
            let mut ids = Vec::with_capacity(count);
            for _ in 0..count {
                ids.push(uuid::Uuid::now_v7().to_string());
            }
            Ok::<_, Box<dyn std::error::Error>>(ids)
        },
        |result| result.len() as u32,
        |result| json!(result) as Value,
    );
}
