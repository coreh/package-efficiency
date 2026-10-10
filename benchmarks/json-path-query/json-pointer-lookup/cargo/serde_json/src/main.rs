use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Value::pointer returns references into the document; the operation resolves
// every pointer and keeps the number of hits, and `describe` resolves them
// again and clones the values into JSON for the verifier (None -> null).
fn lookup(input: &Value) -> Result<usize, String> {
    let document = &input["document"];
    let pointers = input["pointers"].as_array().ok_or("pointers")?;
    Ok(pointers.iter().filter(|p| document.pointer(p.as_str().expect("string pointer")).is_some()).count())
}
fn main() {
    bench_harness::operation::run_value_with_input(
        lookup,
        |hits| *hits as u32,
        |input, _| {
            let document = &input["document"];
            Value::Array(
                input["pointers"].as_array().expect("pointers").iter()
                    .map(|p| document.pointer(p.as_str().expect("string pointer")).cloned().unwrap_or(Value::Null))
                    .collect(),
            )
        },
    );
}
