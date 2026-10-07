use serde_json::{Value, json};
use std::hint::black_box;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Small = smallvec::SmallVec<[i32; 8]>;

fn step(x: u32) -> u32 { x.wrapping_mul(1664525).wrapping_add(1013904223) }

// Builds `count` short vectors of 1 to 8 generated integers, one push at a
// time, and reads every element back. Returns [elements pushed, their sum].
fn build(input: &Value) -> Result<[i64; 2], String> {
    let mut x = input["seed"].as_u64().expect("seed") as u32;
    let count = input["count"].as_u64().expect("count");
    let (mut pushed, mut sum) = (0i64, 0i64);
    for _ in 0..count {
        x = step(x);
        let length = 1 + (x >> 29);
        let mut v = Small::new();
        for _ in 0..length {
            x = step(x);
            v.push((x >> 8) as i32 - (1 << 23));
        }
        let v = black_box(v);
        pushed += v.len() as i64;
        sum += v.iter().map(|&item| item as i64).sum::<i64>();
    }
    Ok([pushed, sum])
}

fn main() {
    bench_harness::operation::run_value(
        build,
        |totals| totals[0] as u32,
        |totals| json!(totals.to_vec()) as Value,
    );
}
