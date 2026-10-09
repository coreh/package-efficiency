use zlib_rs::{DeflateConfig, ReturnCode, compress_bound, compress_slice};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            // Level 6 is zlib's default level; raw deflate is a negative window_bits.
            let config = DeflateConfig { window_bits: -15, ..DeflateConfig::new(6) };
            let mut out = vec![0u8; compress_bound(input.len()) + 32];
            let (done, code) = compress_slice(&mut out, input, config);
            if code != ReturnCode::Ok {
                return Err(format!("deflate: {code:?}").into());
            }
            let n = done.len();
            out.truncate(n);
            Ok(out)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): the bytes as a list of integers.
        |packed| serde_json::json!(packed),
    );
}
