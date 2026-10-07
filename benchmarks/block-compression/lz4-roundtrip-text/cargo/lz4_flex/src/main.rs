#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = lz4_flex::compress_prepend_size(input);
            Ok(String::from_utf8(lz4_flex::decompress_size_prepended(&packed)?)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = lz4_flex::compress_prepend_size(text.as_bytes());
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
