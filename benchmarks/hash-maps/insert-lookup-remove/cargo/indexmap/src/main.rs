use serde_json::{Value, json};
use std::hash::Hash;
use indexmap::IndexMap;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn side<K: Hash + Eq + Copy>(keys: impl Iterator<Item = K> + Clone, probes: impl Iterator<Item = K> + Clone, weight: impl Fn(K) -> i64) -> [i64; 7] {
    let mut map: IndexMap<K, i64> = IndexMap::new();
    for (i, k) in keys.clone().enumerate() {
        map.insert(k, i as i64);
    }
    let size = map.len() as i64;
    let (mut hits, mut found) = (0, 0);
    for p in probes.clone() {
        if let Some(v) = map.get(&p) {
            hits += 1;
            found += *v;
        }
    }
    let (mut ksum, mut vsum) = (0, 0);
    for (k, v) in map.iter() {
        ksum += weight(*k);
        vsum += *v;
    }
    for k in keys.step_by(2) {
        map.swap_remove(&k);
    }
    let count = map.len() as i64;
    let mut left = 0;
    for p in probes {
        if map.contains_key(&p) {
            left += 1;
        }
    }
    [size, hits, found, ksum, vsum, count, left]
}

fn ints(v: &Value) -> impl Iterator<Item = i64> + Clone {
    v.as_array().expect("array").iter().map(|k| k.as_i64().expect("integer"))
}

fn strings(v: &Value) -> impl Iterator<Item = &str> + Clone {
    v.as_array().expect("array").iter().map(|k| k.as_str().expect("string"))
}

fn operation(input: &Value) -> Result<[i64; 14], std::convert::Infallible> {
    let a = side(ints(&input["ints"]), ints(&input["intProbes"]), |k| k);
    let b = side(strings(&input["strings"]), strings(&input["stringProbes"]), |k| k.len() as i64);
    let mut out = [0i64; 14];
    out[..7].copy_from_slice(&a);
    out[7..].copy_from_slice(&b);
    Ok(out)
}

fn main() {
    bench_harness::operation::run_value(operation, |r| r[0] as u32, |r| json!(r.to_vec()));
}
