use std::{cell::RefCell, collections::HashMap};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    // Each pattern is compiled the first time it is seen and reused after.
    let compiled: RefCell<HashMap<String, fancy_regex::Regex>> = RefCell::new(HashMap::new());
    bench_harness::operation::run_value(
        |value| {
            let pattern = value["pattern"].as_str().expect("pattern");
            let text = value["text"].as_str().expect("text");
            let mut compiled = compiled.borrow_mut();
            if !compiled.contains_key(pattern) {
                compiled.insert(pattern.to_owned(), fancy_regex::Regex::new(pattern)?);
            }
            let regex = &compiled[pattern];
            regex.find_iter(text).map(|m| m.map(|m| m.as_str().to_owned())).collect::<Result<Vec<String>, fancy_regex::Error>>()
        },
        |matches| matches.len() as u32,
        |matches| serde_json::json!(matches),
    );
}
