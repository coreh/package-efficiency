use serde_json::{Value, json};
use sketches_ddsketch::{Config, DDSketch};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let mut sketch = DDSketch::new(Config::default());
            for sample in input.as_array().expect("array fixture") {
                sketch.add(sample.as_u64().expect("integer sample") as f64);
            }
            let mut out = [0.0f64; 4];
            for (slot, q) in out.iter_mut().zip([0.5, 0.9, 0.99, 0.999]) {
                *slot = sketch.quantile(q)?.expect("non-empty sketch");
            }
            Ok::<_, sketches_ddsketch::DDSketchError>(out)
        },
        |result| result.len() as u32,
        |result| json!(result.to_vec()) as Value,
    );
}
