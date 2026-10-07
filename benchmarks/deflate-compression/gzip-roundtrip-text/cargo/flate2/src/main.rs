use std::io::Read;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let mut packed = Vec::new();
            flate2::read::GzEncoder::new(input, flate2::Compression::default()).read_to_end(&mut packed)?;
            let mut out = String::new();
            flate2::read::GzDecoder::new(packed.as_slice()).read_to_string(&mut out)?;
            Ok(out)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let mut packed = Vec::new();
            flate2::read::GzEncoder::new(text.as_bytes(), flate2::Compression::default()).read_to_end(&mut packed).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
