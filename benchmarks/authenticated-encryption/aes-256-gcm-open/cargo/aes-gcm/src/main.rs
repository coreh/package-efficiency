use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Nonce};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Message {
    key: Vec<u8>,
    nonce: Vec<u8>,
    aad: Vec<u8>,
    sealed: Vec<u8>,
}

fn field(v: &Value, k: &str) -> Vec<u8> {
    v[k].as_str().expect("string field").as_bytes().to_vec()
}

// Untimed, once per fixture: the four strings become byte vectors.
fn prepare(v: &Value) -> Message {
    let sealed = v["sealed"].as_str().expect("string field").chars().map(|c| c as u8).collect();
    Message { key: field(v, "key"), nonce: field(v, "nonce"), aad: field(v, "aad"), sealed }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |m| {
            let cipher = Aes256Gcm::new_from_slice(&m.key).map_err(|e| e.to_string())?;
            let nonce = Nonce::try_from(&m.nonce[..]).map_err(|_| "bad nonce".to_string())?;
            cipher
                .decrypt(&nonce, Payload { msg: &m.sealed, aad: &m.aad })
                .map_err(|e| e.to_string())
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
