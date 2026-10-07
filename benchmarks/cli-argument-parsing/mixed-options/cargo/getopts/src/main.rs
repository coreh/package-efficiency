use getopts::Options;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The common result shape. Building it is part of the measured call, as it is
// for the other entries; turning it into JSON for the verifier is not.
struct Parsed { verbose: bool, dry: bool, name: Option<String>, count: Option<i64>, tags: Vec<String>, files: Vec<String> }
fn consume(p: &Parsed) -> u32 { (p.files.len() + p.tags.len() + 1) as u32 }
fn describe(p: &Parsed) -> serde_json::Value {
    serde_json::json!({"verbose": p.verbose, "dry": p.dry, "name": p.name, "count": p.count, "tags": p.tags, "files": p.files})
}

fn main() {
    let mut opts = Options::new();
    opts.optflag("v", "verbose", "");
    opts.optflag("d", "dry-run", "");
    opts.optopt("n", "name", "", "TEXT");
    opts.optopt("c", "count", "", "INT");
    opts.optmulti("t", "tag", "", "TEXT");
    bench_harness::operation::run_value(|value| {
        let argv = value["argv"].as_array().expect("argv array").iter().map(|a| a.as_str().expect("string"));
        let m = opts.parse(argv).map_err(|e| e.to_string())?;
        Ok::<_, String>(Parsed {
            verbose: m.opt_present("verbose"),
            dry: m.opt_present("dry-run"),
            name: m.opt_str("name"),
            count: m.opt_get::<i64>("count").map_err(|e| e.to_string())?,
            tags: m.opt_strs("tag"),
            files: m.free,
        })
    }, consume, describe);
}
