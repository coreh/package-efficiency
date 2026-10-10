use k256::ecdsa::{Signature, VerifyingKey, signature::hazmat::PrehashVerifier};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    public: Vec<u8>,
    signature: Vec<u8>,
    digest: Vec<u8>,
}

fn bytes(v: &Value, k: &str) -> Vec<u8> {
    hex::decode(v[k].as_str().expect("string field")).expect("hex")
}

// Untimed, once per fixture: hex becomes bytes.
fn prepare(v: &Value) -> Input {
    Input { public: bytes(v, "publicKey"), signature: bytes(v, "signature"), digest: bytes(v, "digest") }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |i| -> Result<bool, String> {
            let key = VerifyingKey::from_sec1_bytes(&i.public).map_err(|e| e.to_string())?;
            let signature = Signature::from_slice(&i.signature).map_err(|e| e.to_string())?;
            Ok(key.verify_prehash(&i.digest, &signature).is_ok())
        },
        |ok| *ok as u32,
        |_, ok| Value::Bool(*ok),
    );
}
