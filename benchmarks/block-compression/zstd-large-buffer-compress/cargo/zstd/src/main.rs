#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            // One-shot call, like Python's compress: libzstd is told the input size.
            Ok(zstd::bulk::compress(input, 0)?)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            let text = String::from_utf8(zstd::decode_all(packed.as_slice()).expect("decompress")).expect("utf8");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
