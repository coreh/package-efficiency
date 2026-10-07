#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use serde_json::json;
use compact_str::CompactString;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let input = value["text"].as_str().expect("text");
            let second = value["other"].as_str().expect("other");
            let source = CompactString::new(input);
            let copy = source.clone();
            // Compared with a value built on its own, not with the clone's source; a quarter of the pairs differ.
            let other = CompactString::new(second);
            let equal = copy == other;
            Ok::<_, std::convert::Infallible>((copy, equal))
        },
        |(copy, equal)| copy.len() as u32 + u32::from(*equal),
        |(copy, equal)| json!({"text": copy.as_str(), "length": copy.len(), "equal": equal}),
    );
}
