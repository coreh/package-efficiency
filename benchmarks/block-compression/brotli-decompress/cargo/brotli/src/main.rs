#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the binary string (one char per byte) becomes bytes.
fn prepare(value: &serde_json::Value) -> Vec<u8> {
    value.as_str().expect("string fixture").chars().map(|c| c as u8).collect::<Vec<u8>>()
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |b| {
            let mut out = Vec::new();
            brotli::BrotliDecompress(&mut &b[..], &mut out)?;
            Ok::<Vec<u8>, std::io::Error>(out)
        },
        |out| out.len() as u32,
        // Verifier only (not timed): the bytes as a binary string.
        |_, out| serde_json::json!(out.iter().map(|&b| b as char).collect::<String>()),
    );
}
