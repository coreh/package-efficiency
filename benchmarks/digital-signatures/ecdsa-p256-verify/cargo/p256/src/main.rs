use p256::ecdsa::{Signature, VerifyingKey, signature::Verifier};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<bool, String> {
            let public = hex::decode(input["publicKey"].as_str().expect("publicKey")).map_err(|e| e.to_string())?;
            let signature = hex::decode(input["signature"].as_str().expect("signature")).map_err(|e| e.to_string())?;
            let message = input["message"].as_str().expect("message").as_bytes();
            let key = VerifyingKey::from_sec1_bytes(&public).map_err(|e| e.to_string())?;
            let signature = Signature::from_slice(&signature).map_err(|e| e.to_string())?;
            Ok(key.verify(message, &signature).is_ok())
        },
        |ok| *ok as u32,
        |ok| json!(*ok) as Value,
    );
}
