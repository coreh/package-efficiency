#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use weezl::{BitOrder, decode::Decoder, encode::Encoder};

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<String, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            let packed = Encoder::new(BitOrder::Lsb, 8).encode(input)?;
            Ok(String::from_utf8(Decoder::new(BitOrder::Lsb, 8).decode(&packed)?)?)
        },
        |text| text.len() as u32,
        // Verifier only (not timed): adds the size of what the same compression call produces.
        |text| {
            let packed = Encoder::new(BitOrder::Lsb, 8).encode(text.as_bytes()).expect("compress");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
