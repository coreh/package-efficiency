use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The library returns references into the document; the operation keeps their
// count and `describe` runs the query again to build the JSON for the verifier.
fn select(input: &Value) -> Result<usize, String> {
    let query = input["query"].as_str().expect("string query");
    jsonpath_lib::select(&input["document"], query).map(|nodes| nodes.len()).map_err(|e| format!("{e:?}"))
}
fn main() {
    bench_harness::operation::run_value_with_input(
        select,
        |count| *count as u32,
        |input, _| {
            let nodes = jsonpath_lib::select(&input["document"], input["query"].as_str().expect("string query")).expect("query");
            Value::Array(nodes.into_iter().cloned().collect())
        },
    );
}
