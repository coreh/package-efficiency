#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use mlua::{Lua, Value};

enum Out {
    Num(f64),
    Str(String),
}

fn run(script: &str) -> Result<Out, String> {
    let lua = Lua::new();
    let value: Value = lua.load(script).eval().map_err(|e| e.to_string())?;
    match value {
        Value::Integer(i) => Ok(Out::Num(i as f64)),
        Value::Number(n) => Ok(Out::Num(n)),
        Value::String(s) => Ok(Out::Str(s.to_str().map_err(|e| e.to_string())?.to_string())),
        _ => Err("unexpected result type".to_string()),
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
