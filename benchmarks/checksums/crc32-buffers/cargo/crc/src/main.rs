use crc::{Crc, CRC_32_ISO_HDLC};
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const CRC32: Crc<u32> = Crc::<u32>::new(&CRC_32_ISO_HDLC);

fn main() {
    bench_harness::operation::run_value(
        |value| Ok::<u32, std::convert::Infallible>(CRC32.checksum(value.as_str().expect("string fixture").as_bytes())),
        |sum| *sum & 0xffff,
        |sum| json!(sum),
    );
}
