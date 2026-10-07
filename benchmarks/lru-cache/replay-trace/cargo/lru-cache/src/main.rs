use lru_cache::LruCache;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<u32, String> {
            let mut cache = LruCache::new(input["capacity"].as_u64().ok_or("capacity")? as usize);
            let mut hits = 0u32;
            for key in input["keys"].as_array().ok_or("keys")? {
                let key = key.as_u64().ok_or("key")?;
                if cache.get_mut(&key).is_some() {
                    hits += 1;
                } else {
                    cache.insert(key, 1u8);
                }
            }
            Ok(hits)
        },
        |hits| *hits,
        |hits| -> Value { json!(hits) },
    );
}
