use aes::Aes256;
use ctr::cipher::{KeyIvInit, StreamCipher};
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Aes256Ctr = ctr::Ctr128BE<Aes256>;

struct Message {
    key: Vec<u8>,
    iv: Vec<u8>,
    text: Vec<u8>,
}

fn field(v: &Value, k: &str) -> Vec<u8> {
    v[k].as_str().expect("string field").as_bytes().to_vec()
}

// Untimed, once per fixture: the three strings become byte vectors.
fn prepare(v: &Value) -> Message {
    Message { key: field(v, "key"), iv: field(v, "iv"), text: field(v, "text") }
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |m| {
            let mut cipher = Aes256Ctr::new_from_slices(&m.key, &m.iv).map_err(|e| e.to_string())?;
            // apply_keystream overwrites its buffer and the prepared bytes are shared, so it works on a copy.
            let mut buf = m.text.clone();
            cipher.apply_keystream(&mut buf);
            Ok::<Vec<u8>, String>(buf)
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
