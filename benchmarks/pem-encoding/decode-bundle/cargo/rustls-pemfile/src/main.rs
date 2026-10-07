use rustls_pemfile::Item;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn base64(data: &[u8]) -> String {
    const T: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for c in data.chunks(3) {
        let n = (c[0] as u32) << 16 | (*c.get(1).unwrap_or(&0) as u32) << 8 | *c.get(2).unwrap_or(&0) as u32;
        out.push(T[(n >> 18) as usize & 63] as char);
        out.push(T[(n >> 12) as usize & 63] as char);
        out.push(if c.len() > 1 { T[(n >> 6) as usize & 63] as char } else { '=' });
        out.push(if c.len() > 2 { T[n as usize & 63] as char } else { '=' });
    }
    out
}

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut reader = value.as_str().expect("string fixture").as_bytes();
            rustls_pemfile::read_all(&mut reader).collect::<Result<Vec<Item>, _>>()
        },
        |items| items.len() as u32,
        |items| {
            Value::Array(
                items
                    .iter()
                    .map(|item| match item {
                        Item::X509Certificate(d) => json!({"label": "CERTIFICATE", "data": base64(d.as_ref())}),
                        Item::Pkcs1Key(d) => json!({"label": "RSA PRIVATE KEY", "data": base64(d.secret_pkcs1_der())}),
                        Item::Pkcs8Key(d) => json!({"label": "PRIVATE KEY", "data": base64(d.secret_pkcs8_der())}),
                        Item::Sec1Key(d) => json!({"label": "EC PRIVATE KEY", "data": base64(d.secret_sec1_der())}),
                        Item::SubjectPublicKeyInfo(d) => json!({"label": "PUBLIC KEY", "data": base64(d.as_ref())}),
                        other => json!({"label": "UNKNOWN", "data": format!("{other:?}")}),
                    })
                    .collect(),
            )
        },
    );
}
