use fixedbitset::FixedBitSet;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn fill(size: usize, positions: &Value) -> FixedBitSet {
    let mut set = FixedBitSet::with_capacity(size);
    for p in positions.as_array().expect("array") {
        set.insert(p.as_u64().expect("integer") as usize);
    }
    set
}

fn run(input: &Value) -> Result<[usize; 4], String> {
    let size = input["size"].as_u64().expect("size") as usize;
    let a = fill(size, &input["a"]);
    let b = fill(size, &input["b"]);
    let mut union = a.clone();
    union.union_with(&b);
    let mut inter = a.clone();
    inter.intersect_with(&b);
    Ok([a.count_ones(..), b.count_ones(..), union.count_ones(..), inter.count_ones(..)])
}

fn main() {
    bench_harness::operation::run_value(run, |r| r[2] as u32, |r| json!(r));
}
