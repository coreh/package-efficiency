use aws_lc_rs::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
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
            let key = LessSafeKey::new(UnboundKey::new(&AES_256_GCM, &m.key).map_err(|e| e.to_string())?);
            let nonce = Nonce::try_assume_unique_for_key(&m.nonce).map_err(|e| e.to_string())?;
            // open_in_place overwrites its buffer and the prepared bytes are shared, so it works on a copy.
            let mut buf = m.sealed.clone();
            let n = key.open_in_place(nonce, Aad::from(&m.aad[..]), &mut buf).map_err(|e| e.to_string())?.len();
            buf.truncate(n);
            Ok::<Vec<u8>, String>(buf)
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
