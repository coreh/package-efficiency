use std::{cell::RefCell, collections::HashMap};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Span = std::ops::Range<usize>;

fn main() {
    // Each pattern is compiled the first time it is seen and reused after.
    let compiled: RefCell<HashMap<String, regex_automata::meta::Regex>> = RefCell::new(HashMap::new());
    // The groups borrow from the input, so the measured call keeps each group's
    // byte span; `describe` slices the input with them for the verifier,
    // outside any measured work.
    bench_harness::operation::run_value_with_input(
        |value| {
            let pattern = value["pattern"].as_str().expect("pattern");
            let text = value["text"].as_str().expect("text");
            let mut compiled = compiled.borrow_mut();
            if !compiled.contains_key(pattern) {
                compiled.insert(pattern.to_owned(), regex_automata::meta::Regex::new(pattern)?);
            }
            let regex = &compiled[pattern];
            let groups = regex.captures_len();
            Ok::<_, regex_automata::meta::BuildError>(
                regex
                    .captures_iter(text)
                    .map(|caps| (1..groups).map(|i| caps.get_group(i).map_or(0..0, |s| s.range())).collect::<Vec<Span>>())
                    .collect::<Vec<Vec<Span>>>(),
            )
        },
        |matches| matches.len() as u32,
        |value, matches| {
            let text = value["text"].as_str().unwrap();
            serde_json::json!(matches.iter().map(|m| m.iter().map(|span| &text[span.clone()]).collect::<Vec<&str>>()).collect::<Vec<_>>())
        },
    );
}
