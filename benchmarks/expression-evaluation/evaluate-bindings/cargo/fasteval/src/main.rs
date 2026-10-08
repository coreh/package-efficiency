use fasteval::{Compiler, Evaler, Parser, Slab};
use serde_json::{Value, json};
use std::collections::BTreeMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The variable sets are handed over as the crate's own namespace type, built once per fixture.
fn prepare(input: &Value) -> (String, Vec<BTreeMap<String, f64>>) {
    let sets = input["vars"].as_array().expect("vars").iter().map(|set| {
        set.as_object().expect("object").iter().map(|(k, v)| (k.clone(), v.as_f64().expect("number"))).collect()
    }).collect();
    (input["expr"].as_str().expect("expr").to_owned(), sets)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(expr, sets)| {
            let parser = Parser::new();
            let mut slab = Slab::new();
            let compiled = parser.parse(expr, &mut slab.ps).map_err(|e| e.to_string())?.from(&slab.ps).compile(&slab.ps, &mut slab.cs);
            sets.iter().map(|set| {
                let mut ns = |name: &str, args: Vec<f64>| -> Option<f64> { if args.is_empty() { set.get(name).copied() } else { None } };
                compiled.eval(&slab, &mut ns).map_err(|e| e.to_string())
            }).collect::<Result<Vec<f64>, String>>()
        },
        |out| out.len() as u32,
        |_, out| json!(out),
    );
}
