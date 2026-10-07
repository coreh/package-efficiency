use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn floats(value: &Value) -> Vec<f64> {
    value.as_array().expect("array").iter().map(|x| x.as_f64().expect("number")).collect()
}

use ndarray::Array2;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let n = input["n"].as_u64().expect("n") as usize;
            let a = Array2::from_shape_vec((n, n), floats(&input["a"])).unwrap();
            let b = Array2::from_shape_vec((n, n), floats(&input["b"])).unwrap();
            Ok::<_, Infallible>(a.dot(&b))
        },
        |product| product.len() as u32,
        |product| json!(product.iter().copied().collect::<Vec<f64>>()),
    );
}
