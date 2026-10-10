use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let pairs = value.as_array().ok_or("array fixture")?;
            let mut out = Vec::with_capacity(pairs.len());
            for pair in pairs {
                let a = pair[0].as_str().ok_or("string fixture")?;
                let b = pair[1].as_str().ok_or("string fixture")?;
                out.push(strsim::jaro_winkler(a, b));
            }
            Ok::<Vec<f64>, &str>(out)
        },
        |scores| scores.len() as u32,
        |scores| json!(scores),
    );
}
