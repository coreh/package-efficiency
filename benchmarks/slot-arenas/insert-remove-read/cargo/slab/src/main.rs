use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Out { live: u32, sum: u64, mix: u32 }
fn value(i: u64, seed: u64) -> u32 { ((i * 2654435761 + seed) & 0xffff_ffff) as u32 }

fn run(input: &Value) -> Result<Out, String> {
    let first = input["first"].as_u64().ok_or("first")?;
    let extra = input["extra"].as_u64().ok_or("extra")?;
    let seed = input["seed"].as_u64().ok_or("seed")?;
    let mut map = slab::Slab::new();
    let mut keys: Vec<usize> = Vec::new();
    for i in 0..first { keys.push(map.insert(value(i, seed))); }
    let mut position = 0;
    keys.retain(|key| { let drop = position % 2 == 0; position += 1; if drop { map.remove(*key); } !drop });
    for j in 0..extra { keys.push(map.insert(value(first + j, seed))); }
    let (mut sum, mut mix) = (0u64, 0u32);
    for key in &keys {
        let v = *map.get(*key).ok_or("missing key")?;
        sum += v as u64;
        mix = mix.wrapping_mul(31).wrapping_add(v);
    }
    Ok(Out { live: map.len() as u32, sum, mix })
}

fn main() {
    bench_harness::operation::run_value(
        run,
        |out| out.live,
        |out| json!({ "live": out.live, "sum": out.sum, "mix": out.mix }),
    );
}
