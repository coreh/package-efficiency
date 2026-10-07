use globset::{GlobBuilder, GlobSetBuilder};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let mut builder = GlobSetBuilder::new();
    for p in [
        "src/**/*.{ts,tsx}", "**/*.test.js", "docs/**/*.md", "packages/*/src/**/*.ts", "*.json",
        "assets/img/*.{png,jpg,svg}", "**/__tests__/**/*", "lib/**/index.js", "**/file-?.txt", "config/[a-c]*.yml",
    ] {
        builder.add(GlobBuilder::new(p).literal_separator(true).build().expect("glob"));
    }
    let set = builder.build().expect("set");
    bench_harness::operation::run_value(
        |value| {
            Ok::<Vec<bool>, globset::Error>(
                value["paths"].as_array().expect("paths").iter().map(|p| set.is_match(p.as_str().expect("path"))).collect(),
            )
        },
        |result| result.len() as u32,
        |result| Value::from(result.clone()),
    );
}
