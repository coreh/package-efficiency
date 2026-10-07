use serde_json::Value;
use std::path::PathBuf;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Job {
    root: String,
    patterns: Vec<String>,
}

fn main() {
    bench_harness::operation::run_prepared(
        |input| Job {
            root: input["root"].as_str().expect("root").to_owned(),
            patterns: input["patterns"].as_array().expect("patterns").iter().map(|p| p.as_str().expect("pattern").to_owned()).collect(),
        },
        |job| -> Result<Vec<Vec<PathBuf>>, String> {
            job.patterns
                .iter()
                .map(|pattern| {
                    globwalk::GlobWalkerBuilder::from_patterns(&job.root, &[pattern.as_str()])
                        .build()
                        .map_err(|e| e.to_string())?
                        .map(|entry| entry.map(|entry| entry.into_path()))
                        .collect::<Result<Vec<PathBuf>, globwalk::WalkError>>()
                        .map_err(|e| e.to_string())
                })
                .collect()
        },
        |lists| lists.len() as u32,
        |_, lists| Value::from(lists.iter().map(|list| Value::from(list.iter().map(|path| path.to_str().expect("UTF-8 path").to_owned()).collect::<Vec<String>>())).collect::<Vec<Value>>()),
    );
}
