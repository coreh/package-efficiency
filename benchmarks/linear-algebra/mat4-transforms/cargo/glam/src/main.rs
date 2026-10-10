use glam::DMat4;
use serde_json::{json, Value};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the 64 row-major arrays become DMat4 values.
// from_cols_array reads column-major, so the transpose restores the matrix.
fn prepare(input: &Value) -> Vec<DMat4> {
    input["matrices"]
        .as_array()
        .expect("matrices")
        .iter()
        .map(|m| {
            let mut a = [0.0f64; 16];
            for (slot, x) in a.iter_mut().zip(m.as_array().expect("matrix")) {
                *slot = x.as_f64().expect("number");
            }
            DMat4::from_cols_array(&a).transpose()
        })
        .collect()
}

fn rows(m: &DMat4) -> Value {
    json!(m.transpose().to_cols_array().to_vec())
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |ms| {
            let product = ms[1..].iter().fold(ms[0], |acc, m| acc * *m);
            let inverse = product.inverse();
            Ok::<_, std::convert::Infallible>((product, inverse))
        },
        |(p, i)| (p.x_axis.x + i.w_axis.w) as u32,
        |_, (p, i)| json!([rows(p), rows(i)]),
    );
}
