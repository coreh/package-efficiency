#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

// Level 9, not the crate's default of 6: the same level as the other bzip2 entries of this task.
const LEVEL: bzip2::Compression = bzip2::Compression::new(9);

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            use std::io::Read;
            let mut packed = Vec::new();
            bzip2::bufread::BzEncoder::new(input, LEVEL).read_to_end(&mut packed)?;
            let mut out = Vec::new();
            bzip2::bufread::BzDecoder::new(packed.as_slice()).read_to_end(&mut out)?;
            Ok(String::from_utf8(out)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            use std::io::Read;
            let mut packed = Vec::new();
            bzip2::bufread::BzEncoder::new(text.as_bytes(), LEVEL).read_to_end(&mut packed).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
