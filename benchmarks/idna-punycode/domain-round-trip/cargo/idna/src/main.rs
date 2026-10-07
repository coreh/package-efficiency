use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let domain = value.as_str().expect("string fixture");
            let ascii = idna::domain_to_ascii(domain).map_err(|e| e.to_string())?;
            let (unicode, _) = idna::domain_to_unicode(&ascii);
            Ok::<_, String>((ascii, unicode))
        },
        |pair| (pair.0.len() + pair.1.len()) as u32,
        |pair| json!([pair.0, pair.1]),
    );
}
