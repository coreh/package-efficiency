use serde_json::json;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let words = value.as_array().expect("array fixture");
            let mut out: Vec<String> = Vec::with_capacity(words.len() * 2);
            for word in words {
                let word = word.as_str().expect("string word");
                let plural = pluralizer::pluralize(word, 2, false);
                let singular = pluralizer::pluralize(&plural, 1, false);
                out.push(plural);
                out.push(singular);
            }
            Ok::<_, String>(out)
        },
        |out: &Vec<String>| out.len() as u32,
        |out| json!(out),
    );
}
