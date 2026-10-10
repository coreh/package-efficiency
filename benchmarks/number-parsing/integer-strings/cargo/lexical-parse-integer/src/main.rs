use lexical_parse_integer::FromLexical;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let strings = value.as_array().expect("array fixture");
            let mut out = Vec::with_capacity(strings.len());
            for s in strings {
                out.push(i64::from_lexical(s.as_str().expect("string").as_bytes())?);
            }
            Ok::<Vec<i64>, lexical_parse_integer::Error>(out)
        },
        |numbers| numbers.len() as u32,
        |numbers| Value::Array(numbers.iter().map(|n| Value::from(*n)).collect()),
    );
}
