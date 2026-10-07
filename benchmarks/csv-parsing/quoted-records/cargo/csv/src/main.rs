use csv::{ReaderBuilder, StringRecord};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let text = value.as_str().expect("string fixture");
            ReaderBuilder::new().has_headers(false).from_reader(text.as_bytes()).records().collect::<Result<Vec<StringRecord>, _>>()
        },
        |rows| rows.len() as u32,
        |rows| serde_json::Value::Array(rows.iter().map(|r| serde_json::Value::Array(r.iter().map(|f| f.into()).collect())).collect()),
    );
}
