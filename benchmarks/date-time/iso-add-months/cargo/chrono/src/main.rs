use chrono::{Days, Months, NaiveDateTime};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let ts: NaiveDateTime = value["ts"].as_str().expect("ts").parse().expect("valid timestamp");
        let months = value["months"].as_i64().expect("months");
        let days = value["days"].as_i64().expect("days");
        let ts = if months >= 0 { ts.checked_add_months(Months::new(months as u32)) } else { ts.checked_sub_months(Months::new(-months as u32)) }.expect("in range");
        let ts = if days >= 0 { ts.checked_add_days(Days::new(days as u64)) } else { ts.checked_sub_days(Days::new(-days as u64)) }.expect("in range");
        Ok(ts.format("%Y-%m-%d %H:%M:%S").to_string())
    });
}
