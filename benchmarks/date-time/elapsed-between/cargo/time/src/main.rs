use time::{format_description::well_known::Rfc3339, OffsetDateTime};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |v| -> Result<[i64; 3], time::error::Parse> {
            let a = OffsetDateTime::parse(v["from"].as_str().expect("from"), &Rfc3339)?;
            let b = OffsetDateTime::parse(v["to"].as_str().expect("to"), &Rfc3339)?;
            let d = b - a;
            Ok([d.whole_hours(), d.whole_minutes(), d.whole_seconds()])
        },
        |out| out.len() as u32,
        |out| serde_json::json!(out),
    );
}
