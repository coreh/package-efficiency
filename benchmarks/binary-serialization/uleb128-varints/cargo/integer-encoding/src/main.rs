use integer_encoding::VarInt;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: decimal strings become u64 values.
fn prepare(input: &Value) -> Vec<u64> {
    input
        .as_array()
        .expect("value list")
        .iter()
        .map(|v| v.as_str().expect("decimal string").parse::<u64>().expect("u64"))
        .collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |values: &Vec<u64>| {
            let mut bytes: Vec<u8> = Vec::with_capacity(10 * values.len());
            let mut scratch = [0u8; 10];
            for &v in values {
                let n = v.encode_var(&mut scratch[..]);
                bytes.extend_from_slice(&scratch[..n]);
            }
            let mut out: Vec<u64> = Vec::with_capacity(values.len());
            let mut off = 0usize;
            while off < bytes.len() {
                let (v, n) = u64::decode_var(&bytes[off..]).ok_or("decode failed")?;
                out.push(v);
                off += n;
            }
            Ok::<(Vec<u8>, Vec<u64>), &'static str>((bytes, out))
        },
        |(bytes, values): &(Vec<u8>, Vec<u64>)| (bytes.len() + values.len()) as u32,
        |_, (bytes, values)| {
            serde_json::json!([bytes, values.iter().map(|v| v.to_string()).collect::<Vec<_>>()])
        },
    );
}
