use serde_json::{Value, json};


#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Map = rustc_hash::FxHashMap<u64, u64>;

struct Input {
    keys: Vec<u64>,
    probes: Vec<u64>,
}

fn parse(v: &Value) -> Vec<u64> {
    v.as_array().expect("array").iter().map(|s| s.as_str().expect("decimal string").parse::<u64>().expect("u64")).collect()
}

// Untimed, once per fixture: decimal strings become u64 values.
fn prepare(v: &Value) -> Input {
    Input { keys: parse(&v["keys"]), probes: parse(&v["probes"]) }
}

fn operation(input: &Input) -> Result<[u64; 5], std::convert::Infallible> {
    let mut m: Map = Default::default();
    for (i, k) in input.keys.iter().enumerate() {
        m.insert(*k, i as u64);
    }
    let size = m.len() as u64;
    let (mut hits, mut found) = (0u64, 0u64);
    for p in &input.probes {
        if let Some(v) = m.get(p) {
            hits += 1;
            found += *v;
        }
    }
    let mut removed = 0u64;
    for i in (0..input.keys.len()).step_by(3) {
        if m.remove(&input.keys[i]).is_some() {
            removed += 1;
        }
    }
    Ok([size, hits, found, removed, m.len() as u64])
}

fn main() {
    bench_harness::operation::run_prepared(prepare, operation, |r| r[0] as u32, |_, r| json!(r.to_vec()));
}
