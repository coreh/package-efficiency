use aws_lc_rs::cipher::{AES_256, EncryptionContext, PaddedBlockEncryptingKey, UnboundCipherKey};
use aws_lc_rs::iv::FixedLength;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

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
            let key = PaddedBlockEncryptingKey::cbc_pkcs7(UnboundCipherKey::new(&AES_256, &m.key).map_err(|e| e.to_string())?)
                .map_err(|e| e.to_string())?;
            let iv = FixedLength::<16>::try_from(&m.iv[..]).map_err(|e| e.to_string())?;
            // less_safe_encrypt pads and encrypts in place and the prepared bytes are shared, so it works on a copy.
            let mut buf = m.text.clone();
            key.less_safe_encrypt(&mut buf, EncryptionContext::Iv128(iv)).map_err(|e| e.to_string())?;
            Ok::<Vec<u8>, String>(buf)
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.iter().map(|b| format!("{b:02x}")).collect()),
    );
}
