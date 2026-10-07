#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let password = value[0].as_str().expect("password");
            let first = value[1].as_str().expect("first candidate");
            let second = value[2].as_str().expect("second candidate");
            let stored = bcrypt::hash(password, 8).map_err(|e| e.to_string())?;
            Ok::<_, String>((
                bcrypt::verify(first, &stored).map_err(|e| e.to_string())?,
                bcrypt::verify(second, &stored).map_err(|e| e.to_string())?,
                stored,
            ))
        },
        |r| r.0 as u32 + 2 * r.1 as u32,
        |r| serde_json::json!([r.0, r.1, r.2]),
    );
}
