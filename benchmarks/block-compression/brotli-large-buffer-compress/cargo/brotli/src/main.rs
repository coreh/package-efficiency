#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let params = brotli::enc::BrotliEncoderParams::default();
            let mut packed = Vec::new();
            brotli::BrotliCompress(&mut &input[..], &mut packed, &params)?;
            Ok(packed)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            let mut out = Vec::new();
            brotli::BrotliDecompress(&mut packed.as_slice(), &mut out).expect("decompress");
            serde_json::json!({ "text": String::from_utf8(out).expect("utf8"), "compressedBytes": packed.len() })
        },
    );
}
