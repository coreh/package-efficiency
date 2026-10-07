use lru_cache::LruCache;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<[u64; 4], String> {
            let mut cache: LruCache<&str, u64> = LruCache::new(input["capacity"].as_u64().ok_or("capacity")? as usize);
            let (mut hits, mut sum, mut removed) = (0u64, 0u64, 0u64);
            for (i, key) in input["keys"].as_array().ok_or("keys")?.iter().enumerate() {
                let key = key.as_str().ok_or("key")?;
                if i % 11 == 10 {
                    if cache.remove(key).is_some() {
                        removed += 1;
                    }
                } else if let Some(value) = cache.get_mut(key) {
                    hits += 1;
                    sum += *value;
                } else {
                    cache.insert(key, i as u64);
                }
            }
            Ok([hits, sum, removed, cache.len() as u64])
        },
        |result| result[0] as u32,
        |result| -> Value { json!(result) },
    );
}
