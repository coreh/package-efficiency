use std::collections::HashMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(|value| {
        let header = value.as_str().expect("string fixture");
        let mut map = HashMap::new();
        for c in cookie::Cookie::split_parse(header) {
            let c = c.map_err(|e| e.to_string())?;
            map.insert(c.name().to_string(), c.value().to_string());
        }
        Ok::<_, String>(map)
    }, |m: &HashMap<String, String>| m.len() as u32, |m| serde_json::json!(m));
}
