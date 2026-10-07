use radix_trie::{Trie, TrieCommon};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Result = (Vec<Option<u32>>, Vec<Vec<u32>>);

fn operation(input: &Value) -> std::result::Result<Result, String> {
    let keys = input["keys"].as_array().ok_or("keys")?;
    let mut trie: Trie<&str, u32> = Trie::new();
    for (value, key) in keys.iter().enumerate() {
        trie.insert(key.as_str().ok_or("key")?, value as u32);
    }
    let found = input["lookups"].as_array().ok_or("lookups")?.iter()
        .map(|key| trie.get(&key.as_str().unwrap()).copied())
        .collect();
    let scans = input["prefixes"].as_array().ok_or("prefixes")?.iter()
        .map(|prefix| match trie.get_raw_descendant(&prefix.as_str().unwrap()) {
            Some(sub) => sub.values().copied().collect(),
            None => Vec::new(),
        })
        .collect();
    Ok((found, scans))
}

fn main() {
    bench_harness::operation::run_value(
        operation,
        |(found, scans)| (found.len() + scans.len()) as u32,
        |(found, scans)| json!([found, scans]),
    );
}
