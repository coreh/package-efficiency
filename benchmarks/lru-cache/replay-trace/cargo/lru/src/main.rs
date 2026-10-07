use lru::LruCache;
use serde_json::{Value, json};
use std::num::NonZeroUsize;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<u32, String> {
            let capacity = NonZeroUsize::new(input["capacity"].as_u64().ok_or("capacity")? as usize).ok_or("zero capacity")?;
            let mut cache = LruCache::new(capacity);
            let mut hits = 0u32;
            for key in input["keys"].as_array().ok_or("keys")? {
                let key = key.as_u64().ok_or("key")?;
                if cache.get(&key).is_some() {
                    hits += 1;
                } else {
                    cache.put(key, 1u8);
                }
            }
            Ok(hits)
        },
        |hits| *hits,
        |hits| -> Value { json!(hits) },
    );
}
