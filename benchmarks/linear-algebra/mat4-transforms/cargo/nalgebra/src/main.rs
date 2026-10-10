use nalgebra::Matrix4;
use serde_json::{json, Value};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the 64 row-major arrays become Matrix4<f64> values.
fn prepare(input: &Value) -> Vec<Matrix4<f64>> {
    input["matrices"]
        .as_array()
        .expect("matrices")
        .iter()
        .map(|m| {
            let a: Vec<f64> = m.as_array().expect("matrix").iter().map(|x| x.as_f64().expect("number")).collect();
            Matrix4::<f64>::from_row_slice(&a)
        })
        .collect()
}

// Storage is column-major; the transpose iterates in row-major order.
fn rows(m: &Matrix4<f64>) -> Value {
    json!(m.transpose().iter().copied().collect::<Vec<f64>>())
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |ms| {
            let product = ms[1..].iter().fold(ms[0], |acc, m| acc * m);
            let inverse = product.try_inverse().expect("product is invertible");
            Ok::<_, std::convert::Infallible>((product, inverse))
        },
        |(p, i)| (p[(0, 0)] + i[(3, 3)]) as u32,
        |_, (p, i)| json!([rows(p), rows(i)]),
    );
}
