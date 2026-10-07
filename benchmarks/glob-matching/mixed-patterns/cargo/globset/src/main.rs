use globset::GlobBuilder;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let matcher = GlobBuilder::new(value["pattern"].as_str().expect("pattern"))
                .literal_separator(true)
                .build()?
                .compile_matcher();
            Ok::<Vec<bool>, globset::Error>(
                value["paths"].as_array().expect("paths").iter().map(|p| matcher.is_match(p.as_str().expect("path"))).collect(),
            )
        },
        |result| result.len() as u32,
        |result| Value::from(result.clone()),
    );
}
