use lets_find_up::{FindUpKind, FindUpOptions, find_up_with};
use serde_json::Value;
use std::path::PathBuf;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| input["starts"].as_array().expect("starts").iter().map(|start| PathBuf::from(start.as_str().expect("start"))).collect::<Vec<PathBuf>>(),
        |starts| {
            starts
                .iter()
                .map(|start| find_up_with("package.json", FindUpOptions { cwd: start, kind: FindUpKind::File }).map(|found| found.expect("found")))
                .collect::<Result<Vec<PathBuf>, std::io::Error>>()
        },
        |paths| paths.len() as u32,
        |_, paths| Value::from(paths.iter().map(|path| path.to_str().expect("UTF-8 path").to_owned()).collect::<Vec<String>>()),
    );
}
