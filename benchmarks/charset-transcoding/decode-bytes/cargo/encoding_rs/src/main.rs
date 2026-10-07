use encoding_rs::Encoding;
use serde_json::json;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        // Not timed: the fixture's binary string becomes bytes once.
        |value| {
            let encoding = value["encoding"].as_str().expect("encoding").to_owned();
            let bytes: Vec<u8> = value["bytes"].as_str().expect("bytes").chars().map(|c| c as u8).collect();
            (encoding, bytes)
        },
        |(encoding, bytes): &(String, Vec<u8>)| {
            let enc: &'static Encoding = Encoding::for_label(encoding.as_bytes()).ok_or("unknown encoding label")?;
            let (text, _) = enc.decode_without_bom_handling(bytes);
            Ok::<_, String>(text.into_owned())
        },
        |s| s.len() as u32,
        |_, s| json!(s),
    );
}
