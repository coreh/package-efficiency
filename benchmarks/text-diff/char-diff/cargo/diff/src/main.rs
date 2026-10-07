use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Common shape: (op, count) runs, merging consecutive characters of one kind.
fn push(out: &mut Vec<(char, u32)>, op: char) {
    match out.last_mut() {
        Some((last, n)) if *last == op => *n += 1,
        _ => out.push((op, 1)),
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<(char, u32)>, String> {
            let a = value["a"].as_str().expect("string fixture");
            let b = value["b"].as_str().expect("string fixture");
            let mut out = Vec::new();
            for item in diff::chars(a, b) {
                push(&mut out, match item {
                    diff::Result::Left(_) => '-',
                    diff::Result::Both(..) => '=',
                    diff::Result::Right(_) => '+',
                });
            }
            Ok(out)
        },
        |runs| runs.len() as u32,
        |runs| Value::Array(runs.iter().map(|(op, n)| json!([op.to_string(), n])).collect()),
    );
}
