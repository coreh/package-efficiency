#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let params = brotli::enc::BrotliEncoderParams::default();
            let mut packed = Vec::new();
            brotli::BrotliCompress(&mut &input[..], &mut packed, &params)?;
            let mut out = Vec::new();
            brotli::BrotliDecompress(&mut packed.as_slice(), &mut out)?;
            Ok(String::from_utf8(out)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let params = brotli::enc::BrotliEncoderParams::default();
            let mut packed = Vec::new();
            brotli::BrotliCompress(&mut text.as_bytes(), &mut packed, &params).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
