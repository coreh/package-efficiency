#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

// One-shot calls (ZSTD_compress / ZSTD_decompress) at level 0, libzstd's default level 3.
fn pack(input: &[u8]) -> Result<Vec<u8>, Error> {
    let mut out: Vec<u8> = Vec::with_capacity(zstd_safe::compress_bound(input.len()));
    zstd_safe::compress(&mut out, input, 0).map_err(zstd_safe::get_error_name).map_err(Error::from)?;
    Ok(out)
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = pack(input)?;
            let mut out: Vec<u8> = Vec::with_capacity(input.len());
            zstd_safe::decompress(&mut out, &packed).map_err(zstd_safe::get_error_name).map_err(Error::from)?;
            Ok(String::from_utf8(out)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = pack(text.as_bytes()).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
