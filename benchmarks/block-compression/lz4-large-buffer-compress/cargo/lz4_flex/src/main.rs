#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            Ok(lz4_flex::compress_prepend_size(input))
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            let text = String::from_utf8(lz4_flex::decompress_size_prepended(packed).expect("decompress")).expect("utf8");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
