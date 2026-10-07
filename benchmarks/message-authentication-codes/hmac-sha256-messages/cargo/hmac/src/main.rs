use hmac::{Hmac, Mac};
use serde_json::Value;
use sha2::Sha256;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn hex(bytes: &[u8; 32]) -> Value {
    Value::String(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

fn main() {
    bench_harness::operation::run_value(
        |v| {
            let key = v["key"].as_str().expect("key").as_bytes();
            let text = v["text"].as_str().expect("text").as_bytes();
            let mut mac = Hmac::<Sha256>::new_from_slice(key).map_err(|e| e.to_string())?;
            mac.update(text);
            Ok::<[u8; 32], String>(mac.finalize().into_bytes().into())
        },
        |out| out.len() as u32,
        hex,
    );
}
