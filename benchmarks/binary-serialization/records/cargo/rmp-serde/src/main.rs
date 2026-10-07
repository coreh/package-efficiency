use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let bytes = rmp_serde::to_vec(value)?;
            rmp_serde::from_slice::<Value>(&bytes).map_err(Box::<dyn std::error::Error>::from)
        },
        |decoded| match decoded {
            Value::Array(list) => list.len() as u32,
            Value::Object(map) => map.len() as u32,
            _ => 1,
        },
        // Not timed: the timed call returns only the decoded value, so the byte
        // length comes from encoding it once more here.
        |decoded| {
            let bytes: Vec<u8> = rmp_serde::to_vec(decoded).expect("encodes");
            serde_json::json!({ "decoded": decoded, "encodedBytes": bytes.len() })
        },
    );
}
