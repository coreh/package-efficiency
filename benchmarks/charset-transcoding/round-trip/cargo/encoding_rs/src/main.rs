use encoding_rs::Encoding;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn describe(r: &(usize, String)) -> serde_json::Value { serde_json::json!([r.0, r.1]) }

fn main() {
    bench_harness::operation::run_value(
        |value| {
            // Resolved through the library's own label lookup in every call, as
            // the other entries do.
            let label: &'static Encoding = Encoding::for_label(value["encoding"].as_str().expect("encoding").as_bytes()).ok_or("unknown encoding label")?;
            let text = value["text"].as_str().expect("text");
            let (bytes, _, _) = label.encode(text);
            let (decoded, _) = label.decode_without_bom_handling(&bytes);
            Ok::<_, String>((bytes.len(), decoded.into_owned()))
        },
        |r| (r.0 + r.1.len()) as u32,
        describe,
    );
}
