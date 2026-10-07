use chrono::DateTime;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |v| -> Result<[i64; 3], chrono::ParseError> {
            let a = DateTime::parse_from_rfc3339(v["from"].as_str().expect("from"))?;
            let b = DateTime::parse_from_rfc3339(v["to"].as_str().expect("to"))?;
            let d = b.signed_duration_since(a);
            Ok([d.num_hours(), d.num_minutes(), d.num_seconds()])
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
