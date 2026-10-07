#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        // Untimed, once per fixture: the JSON number narrowed to f32 (exact).
        |value| value.as_f64().expect("number fixture") as f32,
        |x: &f32| {
            // The stack buffer the crate writes into and the length of what it wrote; no heap copy.
            let mut buffer = [0u8; lexical_core::BUFFER_SIZE];
            let len = lexical_core::write(*x, &mut buffer).len();
            Ok::<_, std::convert::Infallible>((buffer, len))
        },
        |out| out.1 as u32,
        |_, out| serde_json::Value::String(String::from_utf8_lossy(&out.0[..out.1]).into_owned()),
    );
}
