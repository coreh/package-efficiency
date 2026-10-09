#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            // One-shot call at level 0, libzstd's default level 3.
            let mut out: Vec<u8> = Vec::with_capacity(zstd_safe::compress_bound(input.len()));
            zstd_safe::compress(&mut out, input, 0).map_err(zstd_safe::get_error_name).map_err(Error::from)?;
            Ok(out)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            let mut out: Vec<u8> = Vec::with_capacity(1 << 22);
            zstd_safe::decompress(&mut out, packed).expect("decompress");
            let text = String::from_utf8(out).expect("utf8");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
