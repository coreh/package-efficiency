#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn pack(input: &[u8]) -> Vec<u8> {
    // Default (fast) compressor, uncompressed length written in front as four bytes.
    lz4::block::compress(input, None, true).expect("compress")
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = pack(input);
            Ok(String::from_utf8(lz4::block::decompress(&packed, None)?)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = pack(text.as_bytes());
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
