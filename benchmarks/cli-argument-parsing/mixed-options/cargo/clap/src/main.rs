use clap::{Arg, ArgAction, Command};
use std::cell::RefCell;

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
    let command = RefCell::new(
        Command::new("tool")
            .no_binary_name(true)
            .arg(Arg::new("verbose").short('v').long("verbose").action(ArgAction::SetTrue))
            .arg(Arg::new("dry").short('d').long("dry-run").action(ArgAction::SetTrue))
            .arg(Arg::new("name").short('n').long("name"))
            .arg(Arg::new("count").short('c').long("count").value_parser(clap::value_parser!(i64)))
            .arg(Arg::new("tag").short('t').long("tag").action(ArgAction::Append))
            .arg(Arg::new("files").num_args(0..)),
    );
    bench_harness::operation::run_value(|value| {
        let argv = value["argv"].as_array().expect("argv array").iter().map(|a| a.as_str().expect("string"));
        let m = command.borrow_mut().try_get_matches_from_mut(argv)?;
        Ok::<_, clap::Error>(Parsed {
            verbose: m.get_flag("verbose"),
            dry: m.get_flag("dry"),
            name: m.get_one::<String>("name").cloned(),
            count: m.get_one::<i64>("count").copied(),
            tags: m.get_many::<String>("tag").map(|t| t.cloned().collect()).unwrap_or_default(),
            files: m.get_many::<String>("files").map(|t| t.cloned().collect()).unwrap_or_default(),
        })
    }, consume, describe);
}
