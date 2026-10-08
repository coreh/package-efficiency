use serde_json::Value;
use serde_json_path::JsonPath;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The library returns references into the document; the operation keeps their
// count and `describe` runs the query again to build the JSON for the verifier.
fn select(input: &Value) -> Result<usize, String> {
    let path = JsonPath::parse(input["query"].as_str().expect("string query")).map_err(|e| e.to_string())?;
    Ok(path.query(&input["document"]).all().len())
}
fn main() {
    bench_harness::operation::run_value_with_input(
        select,
        |count| *count as u32,
        |input, _| {
            let path = JsonPath::parse(input["query"].as_str().expect("string query")).expect("parse");
            Value::Array(path.query(&input["document"]).all().into_iter().cloned().collect())
        },
    );
}
