use hdrhistogram::Histogram;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let mut hist = Histogram::<u64>::new(2)?;
            for sample in input.as_array().expect("array fixture") {
                hist.record(sample.as_u64().expect("integer sample"))?;
            }
            Ok::<_, Box<dyn std::error::Error>>([0.5, 0.9, 0.99, 0.999].map(|q| hist.value_at_quantile(q) as f64))
        },
        |result| result.len() as u32,
        |result| json!(result.to_vec()) as Value,
    );
}
