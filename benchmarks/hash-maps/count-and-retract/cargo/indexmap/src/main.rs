use serde_json::{Value, json};
use std::hash::Hash;
use indexmap::{IndexMap, map::Entry};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn side<K: Hash + Eq + Copy>(events: impl Iterator<Item = K>, drops: impl Iterator<Item = K>, weight: impl Fn(K) -> i64) -> [i64; 6] {
    let mut map: IndexMap<K, i64> = IndexMap::new();
    for k in events {
        *map.entry(k).or_insert(0) += 1;
    }
    let (mut max, mut sq, mut ws) = (0i64, 0i64, 0i64);
    for (k, c) in map.iter() {
        let c = *c;
        max = max.max(c);
        sq += c * c;
        ws += weight(*k) * c;
    }
    let distinct = map.len() as i64;
    for k in drops {
        if let Entry::Occupied(mut o) = map.entry(k) { if *o.get() == 1 { o.swap_remove(); } else { *o.get_mut() -= 1; } }
    }
    let mut total = 0i64;
    for (k, c) in map.iter() {
        let _ = k;
        total += *c;
    }
    [distinct, max, sq, ws, map.len() as i64, total]
}

fn ints(v: &Value) -> impl Iterator<Item = i64> {
    v.as_array().expect("array").iter().map(|k| k.as_i64().expect("integer"))
}

fn strings(v: &Value) -> impl Iterator<Item = &str> {
    v.as_array().expect("array").iter().map(|k| k.as_str().expect("string"))
}

fn operation(input: &Value) -> Result<[i64; 12], std::convert::Infallible> {
    let a = side(ints(&input["ints"]), ints(&input["intRetracts"]), |k| k);
    let b = side(strings(&input["strings"]), strings(&input["stringRetracts"]), |k| k.len() as i64);
    let mut out = [0i64; 12];
    out[..6].copy_from_slice(&a);
    out[6..].copy_from_slice(&b);
    Ok(out)
}

fn main() {
    bench_harness::operation::run_value(operation, |r| r[0] as u32, |r| json!(r.to_vec()));
}
