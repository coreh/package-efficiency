use secp256k1::{Message, PublicKey, Secp256k1, ecdsa::Signature};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    public: Vec<u8>,
    signature: Vec<u8>,
    digest: [u8; 32],
}

fn bytes(v: &Value, k: &str) -> Vec<u8> {
    hex::decode(v[k].as_str().expect("string field")).expect("hex")
}

// Untimed, once per fixture: hex becomes bytes.
fn prepare(v: &Value) -> Input {
    Input { public: bytes(v, "publicKey"), signature: bytes(v, "signature"), digest: bytes(v, "digest").try_into().expect("32-byte digest") }
}

fn main() {
    // One verification context, made once and shared (the library's documented use).
    let secp = Secp256k1::verification_only();
    bench_harness::operation::run_prepared(
        prepare,
        |i| -> Result<bool, String> {
            let key = PublicKey::from_slice(&i.public).map_err(|e| e.to_string())?;
            let signature = Signature::from_compact(&i.signature).map_err(|e| e.to_string())?;
            let message = Message::from_digest(i.digest);
            Ok(secp.verify_ecdsa(message, &signature, &key).is_ok())
        },
        |ok| *ok as u32,
        |_, ok| Value::Bool(*ok),
    );
}
