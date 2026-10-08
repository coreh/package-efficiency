use serde_json::json;
use cruet::{to_plural, to_singular};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let words = value.as_array().expect("array fixture");
            let mut out: Vec<String> = Vec::with_capacity(words.len() * 2);
            for word in words {
                let word = word.as_str().expect("string word");
                let plural = to_plural(word);
                let singular = to_singular(&plural);
                out.push(plural);
                out.push(singular);
            }
            Ok::<_, String>(out)
        },
        |out: &Vec<String>| out.len() as u32,
        |out| json!(out),
    );
}
