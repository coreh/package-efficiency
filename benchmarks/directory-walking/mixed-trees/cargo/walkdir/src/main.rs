use serde_json::Value;
use std::path::PathBuf;
use walkdir::WalkDir;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| PathBuf::from(input["root"].as_str().expect("root")),
        |root| WalkDir::new(root).min_depth(1).into_iter().map(|entry| entry.map(|entry| entry.into_path())).collect::<Result<Vec<PathBuf>, walkdir::Error>>(),
        |paths| paths.len() as u32,
        |_, paths| Value::from(paths.iter().map(|path| path.to_str().expect("UTF-8 path").to_owned()).collect::<Vec<String>>()),
    );
}
