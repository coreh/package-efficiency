use colored::Colorize;
use serde_json::Value;
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Pieces {
    style: String,
    a: String,
    b: String,
    c: String,
    d: String,
    e: String,
}

// Untimed, once per fixture: the JSON object becomes a struct of strings, so
// the measured call reads fields as the JavaScript entries do.
fn prepare(v: &Value) -> Pieces {
    let s = |k: &str| v[k].as_str().expect("string fixture").to_owned();
    Pieces { style: s("style"), a: s("a"), b: s("b"), c: s("c"), d: s("d"), e: s("e") }
}

fn main() {
    // There is no terminal here, so colours are forced on, once.
    colored::control::set_override(true);
    bench_harness::operation::run_prepared(
        prepare,
        |p| {
            let Pieces { a, b, c, d, e, .. } = p;
            Ok::<String, Infallible>(match p.style.as_str() {
                "red-green-twice" => format!("{a}{}{c}{}{e}", b.green(), d.green()).red().to_string(),
                "blue-yellow" => format!("{a}{}{c}", b.yellow()).blue().to_string(),
                "bold-dim" => format!("{a}{}{c}", b.dimmed()).bold().to_string(),
                "three-level" => format!("{a}{}{e}", format!("{b}{}{d}", c.blue()).green()).red().to_string(),
                "bold-red-dim" => format!("{a}{}{e}", format!("{b}{}{d}", c.dimmed()).red()).bold().to_string(),
                other => panic!("unknown style {other}"),
            })
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.clone()),
    );
}
