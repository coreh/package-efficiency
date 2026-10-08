#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use boa_engine::{Context, Source};

enum Out {
    Num(f64),
    Str(String),
}

fn run(script: &str) -> Result<Out, String> {
    let mut context = Context::default();
    let value = context
        .eval(Source::from_bytes(script))
        .map_err(|e| e.to_string())?;
    if let Some(s) = value.as_string() {
        Ok(Out::Str(s.to_std_string_escaped()))
    } else if let Some(n) = value.as_number() {
        Ok(Out::Num(n))
    } else {
        Err("unexpected result type".to_string())
    }
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
