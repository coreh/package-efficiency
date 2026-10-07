use jiff::{civil::DateTime, Span};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let ts: DateTime = value["ts"].as_str().expect("ts").parse().expect("valid timestamp");
        let ts = ts.checked_add(Span::new().months(value["months"].as_i64().expect("months"))).expect("in range");
        Ok(ts.checked_add(Span::new().days(value["days"].as_i64().expect("days"))).expect("in range").strftime("%Y-%m-%d %H:%M:%S").to_string())
    });
}
