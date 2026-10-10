use jiff::{Timestamp, tz::TimeZone};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |v| {
            let zone = TimeZone::get(v["zone"].as_str().expect("zone")).expect("known zone");
            let instants: Vec<i64> = v["instants"]
                .as_array()
                .expect("instants")
                .iter()
                .map(|t| t.as_i64().expect("integer instant"))
                .collect();
            (zone, instants)
        },
        |(zone, instants): &(TimeZone, Vec<i64>)| -> Result<Vec<(String, i32)>, jiff::Error> {
            let mut out = Vec::with_capacity(instants.len());
            for &t in instants {
                let ts = Timestamp::from_second(t)?;
                out.push((zone.to_datetime(ts).to_string(), zone.to_offset(ts).seconds()));
            }
            Ok(out)
        },
        |out| out.len() as u32,
        |_input, out| serde_json::json!(out),
    );
}
