use serde_json::{Value, json};
use std::hint::black_box;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Small = tinyvec::TinyVec<[i32; 8]>;

fn step(x: u32) -> u32 { x.wrapping_mul(1664525).wrapping_add(1013904223) }

// Inserts 1 to 8 generated integers at generated positions, removes 0 to 3
// elements at generated positions, pops one more if more than one remain, and
// reads the rest in order. Returns [kept, sum, position-weighted sum].
fn build(input: &Value) -> Result<[i64; 3], String> {
    let mut x = input["seed"].as_u64().expect("seed") as u32;
    let count = input["count"].as_u64().expect("count");
    let (mut kept, mut sum, mut weighted) = (0i64, 0i64, 0i64);
    for _ in 0..count {
        x = step(x);
        let length = 1 + (x >> 29);
        let mut v = Small::new();
        for _ in 0..length {
            x = step(x);
            let pos = ((x >> 8) as usize) % (v.len() + 1);
            x = step(x);
            let value = (x >> 8) as i32 - (1 << 23);
            v.insert(pos, value);
        }
        x = step(x);
        let removals = x >> 30;
        for _ in 0..removals {
            if v.len() <= 1 { break; }
            x = step(x);
            let pos = ((x >> 8) as usize) % v.len();
            v.remove(pos);
        }
        if v.len() > 1 { v.pop(); }
        let v = black_box(v);
        kept += v.len() as i64;
        for (i, &item) in v.iter().enumerate() {
            sum += item as i64;
            weighted += item as i64 * (i as i64 + 1);
        }
    }
    Ok([kept, sum, weighted])
}

fn main() {
    bench_harness::operation::run_value(
        build,
        |totals| totals[0] as u32,
        |totals| json!(totals.to_vec()) as Value,
    );
}
