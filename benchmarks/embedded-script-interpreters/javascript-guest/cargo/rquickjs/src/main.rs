#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use rquickjs::{Context, Runtime, Value};

enum Out {
    Num(f64),
    Str(String),
}

fn run(script: &str) -> Result<Out, String> {
    let runtime = Runtime::new().map_err(|e| e.to_string())?;
    let context = Context::full(&runtime).map_err(|e| e.to_string())?;
    context.with(|ctx| {
        let value: Value = ctx.eval(script).map_err(|e| e.to_string())?;
        if let Some(s) = value.as_string() {
            Ok(Out::Str(s.to_string().map_err(|e| e.to_string())?))
        } else if let Some(n) = value.as_number() {
            Ok(Out::Num(n))
        } else {
            Err("unexpected result type".to_string())
        }
    })
}

fn main() {
    bench_harness::operation::run_value(
        |value| run(value.as_str().expect("script fixture")),
        |out| match out {
            Out::Str(s) => s.len() as u32,
            Out::Num(_) => 1,
        },
        |out| match out {
            Out::Str(s) => serde_json::Value::String(s.clone()),
            Out::Num(n) => serde_json::json!(n),
        },
    );
}
