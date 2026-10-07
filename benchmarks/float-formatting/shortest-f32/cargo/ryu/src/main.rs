#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        // Untimed, once per fixture: the JSON number narrowed to f32 (exact).
        |value| value.as_f64().expect("number fixture") as f32,
        |x: &f32| {
            // The crate's own stack buffer and the length of what it wrote; no heap copy.
            let mut buffer = ryu::Buffer::new();
            let len = buffer.format(*x).len();
            Ok::<_, std::convert::Infallible>((buffer, len))
        },
        |out| out.1 as u32,
        // The buffer has no accessor for its text, so the verifier's string is formatted again from the same input.
        |value, out| {
            let text = ryu::Buffer::new().format(value.as_f64().expect("number fixture") as f32).to_owned();
            assert_eq!(text.len(), out.1);
            serde_json::Value::String(text)
        },
    );
}
