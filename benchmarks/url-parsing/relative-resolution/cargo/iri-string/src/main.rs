use iri_string::format::ToDedicatedString;
use iri_string::types::{UriAbsoluteStr, UriReferenceStr, UriString};
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<UriString, iri_string::validate::Error> {
            let base = UriAbsoluteStr::new(value[0].as_str().expect("base string"))?;
            let reference = UriReferenceStr::new(value[1].as_str().expect("reference string"))?;
            Ok(reference.resolve_against(base).to_dedicated_string())
        },
        |uri| uri.as_str().len() as u32,
        |uri| json!(uri.as_str()),
    );
}
