use serde_json::{Value, json};
use indexmap::IndexSet;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Input {
    a: Vec<i64>,
    b: Vec<i64>,
}

fn ints(v: &Value) -> Vec<i64> {
    v.as_array().expect("array").iter().map(|k| k.as_i64().expect("integer")).collect()
}

// Untimed, once per fixture: the JSON lists become vectors of i64.
fn prepare(v: &Value) -> Input {
    Input { a: ints(&v["a"]), b: ints(&v["b"]) }
}

fn operation(input: &Input) -> Result<[IndexSet<i64>; 3], std::convert::Infallible> {
    let a: IndexSet<i64> = input.a.iter().copied().collect();
    let b: IndexSet<i64> = input.b.iter().copied().collect();
    let union: IndexSet<i64> = a.union(&b).copied().collect();
    let intersection: IndexSet<i64> = a.intersection(&b).copied().collect();
    let difference: IndexSet<i64> = a.difference(&b).copied().collect();
    Ok([union, intersection, difference])
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        operation,
        |r| r[0].len() as u32,
        |_, r| json!(r.iter().map(|s| s.iter().copied().collect::<Vec<i64>>()).collect::<Vec<_>>()),
    );
}
