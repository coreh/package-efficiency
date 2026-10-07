use serde_json::{Value, json};
use similar::{DiffOp, TextDiff};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<(char, u32)>, String> {
            let a = value["a"].as_str().expect("string fixture");
            let b = value["b"].as_str().expect("string fixture");
            let diff = TextDiff::from_chars(a, b);
            let mut out = Vec::new();
            for op in diff.ops() {
                match *op {
                    DiffOp::Equal { len, .. } => out.push(('=', len as u32)),
                    DiffOp::Delete { old_len, .. } => out.push(('-', old_len as u32)),
                    DiffOp::Insert { new_len, .. } => out.push(('+', new_len as u32)),
                    DiffOp::Replace { old_len, new_len, .. } => {
                        out.push(('-', old_len as u32));
                        out.push(('+', new_len as u32));
                    }
                }
            }
            Ok(out)
        },
        |runs| runs.len() as u32,
        |runs| Value::Array(runs.iter().map(|(op, n)| json!([op.to_string(), n])).collect()),
    );
}
