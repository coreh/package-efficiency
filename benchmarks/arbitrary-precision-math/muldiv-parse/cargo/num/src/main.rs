#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<[String; 3], String> {
            let pair = value.as_array().expect("pair fixture");
            let x: num::BigUint = pair[0].as_str().expect("string").parse().map_err(|_| "parse a".to_string())?;
            let y: num::BigUint = pair[1].as_str().expect("string").parse().map_err(|_| "parse b".to_string())?;
            // One division gives both quotient and remainder, like divmod and QuoRem in the other languages.
            let (q, r) = num::Integer::div_rem(&x, &y);
            Ok([(&x * &y).to_string(), q.to_string(), r.to_string()])
        },
        |r| r[0].len() as u32,
        |r| serde_json::json!([r[0], r[1], r[2]]),
    );
}
