use serde_json::json;
use url::Url;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let base = Url::parse(value[0].as_str().expect("base string"))?;
            base.join(value[1].as_str().expect("reference string"))
        },
        |url| url.as_str().len() as u32,
        |url| json!(url.as_str()),
    );
}
