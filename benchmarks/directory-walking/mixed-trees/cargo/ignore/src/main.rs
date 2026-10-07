use ignore::WalkBuilder;
use serde_json::Value;
use std::path::PathBuf;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| PathBuf::from(input["root"].as_str().expect("root")),
        |root| WalkBuilder::new(root).standard_filters(false).build().map(|entry| entry.map(|entry| entry.into_path())).collect::<Result<Vec<PathBuf>, ignore::Error>>(),
        |paths| paths.len() as u32,
        |_, paths| Value::from(paths.iter().map(|path| path.to_str().expect("UTF-8 path").to_owned()).collect::<Vec<String>>()),
    );
}
