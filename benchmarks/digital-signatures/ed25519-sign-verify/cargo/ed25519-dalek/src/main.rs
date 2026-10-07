use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<Signature, String> {
            let seed: [u8; 32] = hex::decode(input["seed"].as_str().expect("seed")).map_err(|e| e.to_string())?.try_into().map_err(|_| "seed length")?;
            let public: [u8; 32] = hex::decode(input["publicKey"].as_str().expect("publicKey")).map_err(|e| e.to_string())?.try_into().map_err(|_| "key length")?;
            let message = input["message"].as_str().expect("message").as_bytes();
            let signature = SigningKey::from_bytes(&seed).sign(message);
            VerifyingKey::from_bytes(&public).map_err(|e| e.to_string())?.verify(message, &signature).map_err(|e| e.to_string())?;
            Ok(signature)
        },
        |signature| signature.to_bytes()[0] as u32,
        |signature| json!(hex::encode(signature.to_bytes())) as Value,
    );
}
