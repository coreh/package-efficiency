use crc::{Crc, CRC_32_ISO_HDLC};
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const CRC32: Crc<u32> = Crc::<u32>::new(&CRC_32_ISO_HDLC);

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let mut digest = CRC32.digest();
            for chunk in value.as_array().expect("array fixture") {
                digest.update(chunk.as_str().expect("string chunk").as_bytes());
            }
            Ok::<u32, std::convert::Infallible>(digest.finalize())
        },
        |sum| *sum & 0xffff,
        |sum| json!(sum),
    );
}
