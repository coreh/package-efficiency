use salsa20::Salsa20;
use salsa20::cipher::{KeyIvInit, StreamCipher};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Message {
    key: Vec<u8>,
    nonce: Vec<u8>,
    text: Vec<u8>,
}

fn field(v: &Value, k: &str) -> Vec<u8> {
    v[k].as_str().expect("string field").as_bytes().to_vec()
}

// Untimed, once per fixture: the three strings become byte vectors.
fn prepare(v: &Value) -> Message {
    Message { key: field(v, "key"), nonce: field(v, "nonce"), text: field(v, "text") }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |m| {
            let mut cipher = Salsa20::new_from_slices(&m.key, &m.nonce).map_err(|e| e.to_string())?;
            let mut out = vec![0u8; m.text.len()];
            cipher.apply_keystream_b2b(&m.text, &mut out);
            Ok::<Vec<u8>, String>(out)
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
