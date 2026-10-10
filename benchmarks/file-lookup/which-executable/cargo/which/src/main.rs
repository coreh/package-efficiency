use serde_json::Value;
use std::path::PathBuf;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Lookup {
    path: String,
    commands: Vec<String>,
    cwd: PathBuf,
}

fn main() {
    bench_harness::operation::run_prepared(
        |input| Lookup {
            path: input["path"].as_str().expect("path").to_owned(),
            commands: input["commands"].as_array().expect("commands").iter().map(|name| name.as_str().expect("name").to_owned()).collect(),
            cwd: PathBuf::from("/"),
        },
        |lookup| Ok::<_, std::convert::Infallible>(lookup.commands.iter().map(|name| which::which_in(name, Some(&lookup.path), &lookup.cwd).ok()).collect::<Vec<Option<PathBuf>>>()),
        |found| found.len() as u32,
        |_, found| Value::from(found.iter().map(|path| path.as_ref().map(|path| path.to_str().expect("UTF-8 path").to_owned())).collect::<Vec<Option<String>>>()),
    );
}
