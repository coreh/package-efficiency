use percent_encoding::{utf8_percent_encode, AsciiSet, NON_ALPHANUMERIC};
use std::borrow::Cow;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const COMPONENT: &AsciiSet = &NON_ALPHANUMERIC.remove(b'-').remove(b'_').remove(b'.').remove(b'~');

fn main() {
    bench_harness::operation::run_borrowed_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        Ok(Cow::from(utf8_percent_encode(input, COMPONENT)))
    });
}
