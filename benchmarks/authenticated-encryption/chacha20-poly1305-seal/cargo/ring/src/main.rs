use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, CHACHA20_POLY1305};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Message {
    key: Vec<u8>,
    nonce: Vec<u8>,
    aad: Vec<u8>,
    text: Vec<u8>,
}

fn field(v: &Value, k: &str) -> Vec<u8> {
    v[k].as_str().expect("string field").as_bytes().to_vec()
}

// Untimed, once per fixture: the four strings become byte vectors.
fn prepare(v: &Value) -> Message {
    Message { key: field(v, "key"), nonce: field(v, "nonce"), aad: field(v, "aad"), text: field(v, "text") }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |m| {
            let key = LessSafeKey::new(UnboundKey::new(&CHACHA20_POLY1305, &m.key).map_err(|e| e.to_string())?);
            let nonce = Nonce::try_assume_unique_for_key(&m.nonce).map_err(|e| e.to_string())?;
            // seal_in_place overwrites its buffer and the prepared bytes are shared, so it works on a copy.
            let mut buf = m.text.clone();
            key.seal_in_place_append_tag(nonce, Aad::from(&m.aad[..]), &mut buf).map_err(|e| e.to_string())?;
            Ok::<Vec<u8>, String>(buf)
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
