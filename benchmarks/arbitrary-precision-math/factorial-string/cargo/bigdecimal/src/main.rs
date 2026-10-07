#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, String> {
            let n = value.as_u64().expect("integer fixture");
            let mut r = bigdecimal::BigDecimal::from(1u32);
            for i in 2..=n { r *= bigdecimal::BigDecimal::from(i); }
            Ok(r.to_string())
        },
        |s| s.len() as u32,
        |s| serde_json::Value::String(s.clone()),
    );
}
