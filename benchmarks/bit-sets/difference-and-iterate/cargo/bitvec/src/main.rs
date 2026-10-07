use bitvec::prelude::*;
use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn fill(size: usize, positions: &Value) -> BitVec<usize, Lsb0> {
    let mut set: BitVec<usize, Lsb0> = BitVec::repeat(false, size);
    for p in positions.as_array().expect("array") {
        set.set(p.as_u64().expect("integer") as usize, true);
    }
    set
}

fn run(input: &Value) -> Result<(Vec<usize>, Vec<usize>), String> {
    let size = input["size"].as_u64().expect("size") as usize;
    let a = fill(size, &input["a"]);
    let b = fill(size, &input["b"]);
    let mut diff = a.clone();
    diff &= !b.clone();
    let mut sym = a.clone();
    sym ^= &b;
    Ok((diff.iter_ones().collect(), sym.iter_ones().collect()))
}

fn main() {
    bench_harness::operation::run_value(run, |r| (r.0.len() + r.1.len()) as u32, |r| json!([r.0, r.1]));
}
