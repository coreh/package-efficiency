use difflib::sequencematcher::SequenceMatcher;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<(char, u32)>, String> {
            let a: Vec<&str> = value["a"].as_str().expect("string fixture").lines().collect();
            let b: Vec<&str> = value["b"].as_str().expect("string fixture").lines().collect();
            let mut matcher = SequenceMatcher::new(&a, &b);
            let mut out = Vec::new();
            for code in matcher.get_opcodes() {
                let (old_len, new_len) = ((code.first_end - code.first_start) as u32, (code.second_end - code.second_start) as u32);
                match code.tag.as_str() {
                    "equal" => out.push(('=', old_len)),
                    "delete" => out.push(('-', old_len)),
                    "insert" => out.push(('+', new_len)),
                    _ => {
                        out.push(('-', old_len));
                        out.push(('+', new_len));
                    }
                }
            }
            Ok(out)
        },
        |runs| runs.len() as u32,
        |runs| Value::Array(runs.iter().map(|(op, n)| json!([op.to_string(), n])).collect()),
    );
}
