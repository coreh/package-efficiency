use zlib_rs::{DeflateConfig, InflateConfig, ReturnCode, compress_bound, compress_slice, decompress_slice};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

// Level 6 is zlib's default level; gzip framing is window_bits 15 + 16.
fn pack(input: &[u8]) -> Result<Vec<u8>, Error> {
    let config = DeflateConfig { window_bits: 31, ..DeflateConfig::new(6) };
    let mut out = vec![0u8; compress_bound(input.len()) + 32];
    let (done, code) = compress_slice(&mut out, input, config);
    if code != ReturnCode::Ok {
        return Err(format!("deflate: {code:?}").into());
    }
    let n = done.len();
    out.truncate(n);
    Ok(out)
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = pack(input)?;
            // The one-shot inflate needs an output buffer; the original length is known to a round trip.
            let mut out = vec![0u8; input.len()];
            let config = InflateConfig { window_bits: 31 };
            let (done, code) = decompress_slice(&mut out, &packed, config);
            if code != ReturnCode::Ok {
                return Err(format!("inflate: {code:?}").into());
            }
            let n = done.len();
            out.truncate(n);
            Ok(String::from_utf8(out)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = pack(text.as_bytes()).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
