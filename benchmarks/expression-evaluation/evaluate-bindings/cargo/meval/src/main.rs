use meval::{Context, Expr};
use serde_json::{Value, json};
use std::str::FromStr;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The variable sets are handed over as the crate's own contexts, built once per fixture.
fn prepare(input: &Value) -> (String, Vec<Context<'static>>) {
    let contexts = input["vars"].as_array().expect("vars").iter().map(|set| {
        let mut context = Context::new();
        for (name, value) in set.as_object().expect("object") {
            context.var(name.clone(), value.as_f64().expect("number"));
        }
        context
    }).collect();
    (input["expr"].as_str().expect("expr").to_owned(), contexts)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(expr, contexts)| {
            let parsed = Expr::from_str(expr).map_err(|e| e.to_string())?;
            contexts.iter().map(|context| parsed.eval_with_context(context).map_err(|e| e.to_string())).collect::<Result<Vec<f64>, String>>()
        },
        |out| out.len() as u32,
        |_, out| json!(out),
    );
}
