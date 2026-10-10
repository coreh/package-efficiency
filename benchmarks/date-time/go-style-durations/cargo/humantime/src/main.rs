#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |v| -> Vec<String> {
            v.as_array()
                .expect("array")
                .iter()
                .map(|s| s.as_str().expect("string").to_owned())
                .collect()
        },
        |texts: &Vec<String>| -> Result<Vec<u64>, humantime::DurationError> {
            let mut out = Vec::with_capacity(texts.len());
            for s in texts {
                out.push(humantime::parse_duration(s)?.as_secs());
            }
            Ok(out)
        },
        |out| out.len() as u32,
        |_input, out| serde_json::json!(out),
    );
}
