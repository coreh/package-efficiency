#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            dotenvy::from_read_iter(value.as_str().expect("string fixture").as_bytes())
                .collect::<Result<Vec<(String, String)>, _>>()
        },
        |pairs| pairs.len() as u32,
        |pairs| serde_json::Value::Object(pairs.iter().map(|(k, v)| (k.clone(), v.as_str().into())).collect()),
    );
}
