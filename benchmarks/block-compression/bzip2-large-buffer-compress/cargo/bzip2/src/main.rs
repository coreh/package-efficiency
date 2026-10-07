#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

// Level 9, not the crate's default of 6: the same level as the other bzip2 entries of this task.
const LEVEL: bzip2::Compression = bzip2::Compression::new(9);

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            use std::io::Read;
            let input = value.as_str().expect("string fixture").as_bytes();
            let mut packed = Vec::new();
            bzip2::read::BzEncoder::new(input, LEVEL).read_to_end(&mut packed)?;
            Ok(packed)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            use std::io::Read;
            let mut out = Vec::new();
            bzip2::read::BzDecoder::new(packed.as_slice()).read_to_end(&mut out).expect("decompress");
            serde_json::json!({ "text": String::from_utf8(out).expect("utf8"), "compressedBytes": packed.len() })
        },
    );
}
