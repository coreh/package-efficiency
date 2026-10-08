use evalexpr::{ContextWithMutableVariables, DefaultNumericTypes, HashMapContext, Value as Val, build_operator_tree};
use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The variable sets are handed over as the crate's own contexts, built once per fixture.
fn prepare(input: &Value) -> (String, Vec<HashMapContext<DefaultNumericTypes>>) {
    let contexts = input["vars"].as_array().expect("vars").iter().map(|set| {
        let mut context = HashMapContext::<DefaultNumericTypes>::new();
        for (name, value) in set.as_object().expect("object") {
            context.set_value(name.clone(), Val::Float(value.as_f64().expect("number"))).unwrap();
        }
        context
    }).collect();
    (input["expr"].as_str().expect("expr").to_owned(), contexts)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(expr, contexts)| {
            let tree = build_operator_tree::<DefaultNumericTypes>(expr).map_err(|e| e.to_string())?;
            contexts.iter().map(|context| tree.eval_with_context(context).map_err(|e| e.to_string())).collect::<Result<Vec<_>, String>>()
        },
        |out| out.len() as u32,
        |_, out| Value::Array(out.iter().map(|v| match v {
            Val::Float(f) => json!(f),
            Val::Boolean(b) => json!(b),
            other => panic!("unexpected value {other:?}"),
        }).collect()),
    );
}
