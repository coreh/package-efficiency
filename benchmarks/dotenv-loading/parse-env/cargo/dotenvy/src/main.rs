use std::collections::HashMap;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            dotenvy::from_read_iter(value.as_str().expect("string fixture").as_bytes())
                .collect::<Result<HashMap<String, String>, _>>()
        },
        |map| map.len() as u32,
        |map| serde_json::to_value(map).unwrap(),
    );
}
