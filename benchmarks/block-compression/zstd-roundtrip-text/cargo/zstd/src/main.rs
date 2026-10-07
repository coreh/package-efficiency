#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            // One-shot calls, like Python's compress/decompress: libzstd is told the input size.
            let packed = zstd::bulk::compress(input, 0)?;
            Ok(String::from_utf8(zstd::bulk::decompress(&packed, input.len())?)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = zstd::bulk::compress(text.as_bytes(), 0).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
