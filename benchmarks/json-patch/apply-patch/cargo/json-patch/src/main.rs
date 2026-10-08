use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Parse both texts, apply the patch, write the document; None when the patch
// cannot be applied.
fn apply(input: &Value) -> Result<Option<String>, serde_json::Error> {
    let mut document: Value = serde_json::from_str(input["document"].as_str().expect("string document"))?;
    let patch: json_patch::Patch = serde_json::from_str(input["patch"].as_str().expect("string patch"))?;
    match json_patch::patch(&mut document, &patch) {
        Ok(()) => serde_json::to_string(&document).map(Some),
        Err(_) => Ok(None),
    }
}
fn main() {
    bench_harness::operation::run_value(
        apply,
        |out| out.as_ref().map_or(0, |text| text.len() as u32),
        |out| out.as_ref().map_or(Value::Null, |text| Value::String(text.clone())),
    );
}
