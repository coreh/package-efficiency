use jiff::Timestamp;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |v| -> Result<[i64; 3], jiff::Error> {
            let a: Timestamp = v["from"].as_str().expect("from").parse()?;
            let b: Timestamp = v["to"].as_str().expect("to").parse()?;
            let d = b.duration_since(a);
            Ok([d.as_hours(), d.as_mins(), d.as_secs()])
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
