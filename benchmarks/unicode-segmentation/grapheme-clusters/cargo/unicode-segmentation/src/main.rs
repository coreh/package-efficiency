use unicode_segmentation::UnicodeSegmentation;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    // The clusters borrow from the input, so the measured call keeps only each
    // cluster's byte length; `describe` slices the input with them for the
    // verifier, outside any measured work.
    bench_harness::operation::run_value_with_input(
        |value| {
            let text = value.as_str().expect("string fixture");
            Ok::<_, std::convert::Infallible>(text.graphemes(true).map(str::len).collect::<Vec<usize>>())
        },
        |lengths| lengths.len() as u32,
        |value, lengths| {
            let text = value.as_str().unwrap();
            let mut at = 0;
            let parts: Vec<&str> = lengths.iter().map(|n| { let s = &text[at..at + n]; at += n; s }).collect();
            serde_json::json!(parts)
        },
    );
}
