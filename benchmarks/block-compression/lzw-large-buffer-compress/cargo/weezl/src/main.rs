#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use weezl::{BitOrder, decode::Decoder, encode::Encoder};

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let input = value.as_str().expect("string fixture").as_bytes();
            Ok(Encoder::new(BitOrder::Lsb, 8).encode(input)?)
        },
        |packed| packed.len() as u32,
        // Verifier only (not timed): decompresses the result and reports its size.
        |packed| {
            let text = String::from_utf8(Decoder::new(BitOrder::Lsb, 8).decode(packed).expect("decompress")).expect("utf8");
            serde_json::json!({ "text": text, "compressedBytes": packed.len() })
        },
    );
}
