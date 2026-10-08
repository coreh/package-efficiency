#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let parser = woothee::parser::Parser::new();
    bench_harness::operation::run_value(move |value| {
        let ua = value.as_str().expect("string fixture");
        let r = parser.parse(ua).ok_or_else(|| "unparsed".to_string())?;
        Ok::<_, String>((r.name.to_string(), r.version.to_string(), r.os.to_string()))
    }, |r: &(String, String, String)| (r.0.len() + r.2.len()) as u32, |r| serde_json::json!({"browser": r.0, "version": r.1, "os": r.2}));
}
