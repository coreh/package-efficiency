use p384::ecdsa::{Signature, VerifyingKey, signature::Verifier};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    public: Vec<u8>,
    signature: Vec<u8>,
    message: Vec<u8>,
}

fn bytes(v: &Value, k: &str) -> Vec<u8> {
    hex::decode(v[k].as_str().expect("string field")).expect("hex")
}

// Untimed, once per fixture: hex becomes bytes and the message its UTF-8 bytes.
fn prepare(v: &Value) -> Input {
    Input { public: bytes(v, "publicKey"), signature: bytes(v, "signature"), message: v["message"].as_str().expect("string field").as_bytes().to_vec() }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |i| -> Result<bool, String> {
            let key = match VerifyingKey::from_sec1_bytes(&i.public) { Ok(k) => k, Err(_) => return Ok(false) };
            let signature = match Signature::from_slice(&i.signature) { Ok(s) => s, Err(_) => return Ok(false) };
            Ok(key.verify(&i.message, &signature).is_ok())
        },
        |ok| *ok as u32,
        |_, ok| Value::Bool(*ok),
    );
}
