#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

// Verifier only (not timed): standard base64 with padding.
fn base64(data: &[u8]) -> String {
    const A: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(data.len().div_ceil(3) * 4);
    for c in data.chunks(3) {
        let n = (c[0] as u32) << 16 | (*c.get(1).unwrap_or(&0) as u32) << 8 | *c.get(2).unwrap_or(&0) as u32;
        out.push(A[(n >> 18) as usize & 63] as char);
        out.push(A[(n >> 12) as usize & 63] as char);
        out.push(if c.len() > 1 { A[(n >> 6) as usize & 63] as char } else { '=' });
        out.push(if c.len() > 2 { A[n as usize & 63] as char } else { '=' });
    }
    out
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<(Vec<u8>, String), Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let compressed = snap::raw::Encoder::new().compress_vec(input)?;
            let restored = snap::raw::Decoder::new().decompress_vec(&compressed)?;
            Ok((compressed, String::from_utf8(restored)?))
        },
        |(compressed, text)| (compressed.len() + text.len()) as u32,
        |(compressed, text)| serde_json::json!({ "compressed": base64(&compressed), "text": text }),
    );
}
