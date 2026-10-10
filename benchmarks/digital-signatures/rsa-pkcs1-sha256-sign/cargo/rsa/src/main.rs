use rsa::RsaPrivateKey;
use rsa::pkcs1::DecodeRsaPrivateKey;
use rsa::pkcs1v15::SigningKey;
use rsa::signature::{SignatureEncoding, Signer};
use serde_json::Value;
use sha2::Sha256;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    key: RsaPrivateKey,
    message: Vec<u8>,
}

// Untimed, once per fixture: the PEM is parsed and the message becomes bytes.
fn prepare(v: &Value) -> Input {
    let pem = v["privateKey"].as_str().expect("privateKey");
    let key = RsaPrivateKey::from_pkcs1_pem(pem).expect("PKCS#1 PEM");
    Input { key, message: v["message"].as_str().expect("message").as_bytes().to_vec() }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |i| -> Result<Vec<u8>, String> {
            // The plain Signer path: it hashes the message with SHA-256 and does not blind.
            let signer = SigningKey::<Sha256>::new(i.key.clone());
            Ok(signer.sign(&i.message).to_vec())
        },
        |sig| sig.len() as u32,
        |_, sig| Value::from(sig.iter().map(|b| Value::from(*b)).collect::<Vec<_>>()),
    );
}
