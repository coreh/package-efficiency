#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = miniz_oxide::deflate::compress_to_vec_zlib(input, 6);
            let out = miniz_oxide::inflate::decompress_to_vec_zlib(&packed).map_err(|e| format!("{e:?}"))?;
            Ok(String::from_utf8(out)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = miniz_oxide::deflate::compress_to_vec_zlib(text.as_bytes(), 6);
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
