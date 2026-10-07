use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use nalgebra::DMatrix;

// One allocation and one pass: the JSON numbers are written straight into the
// matrix's column-major storage, with no intermediate Vec<f64>.
fn matrix(n: usize, value: &Value) -> DMatrix<f64> {
    DMatrix::from_row_iterator(n, n, value.as_array().expect("array").iter().map(|x| x.as_f64().expect("number")))
}

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let n = input["n"].as_u64().expect("n") as usize;
            let a = matrix(n, &input["a"]);
            let b = matrix(n, &input["b"]);
            Ok::<_, Infallible>(a * b)
        },
        |product| product.len() as u32,
        // Storage is column-major; the transpose iterates in row-major order.
        |product| json!(product.transpose().iter().copied().collect::<Vec<f64>>()),
    );
}
