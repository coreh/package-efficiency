use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut bytes = Vec::new();
            ciborium::into_writer(value, &mut bytes).map_err(|e| e.to_string())?;
            ciborium::from_reader::<Value, _>(bytes.as_slice()).map_err(|e| e.to_string())
        },
        |decoded| match decoded {
            Value::Array(list) => list.len() as u32,
            Value::Object(map) => map.len() as u32,
            _ => 1,
        },
        // Not timed: the timed call returns only the decoded value, so the byte
        // length comes from encoding it once more here.
        |decoded| {
            let mut bytes: Vec<u8> = Vec::new();
            ciborium::into_writer(decoded, &mut bytes).expect("encodes");
            serde_json::json!({ "decoded": decoded, "encodedBytes": bytes.len() })
        },
    );
}
