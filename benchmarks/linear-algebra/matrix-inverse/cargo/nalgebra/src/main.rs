use serde_json::json;
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

use nalgebra::DMatrix;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let n = input["n"].as_u64().expect("n") as usize;
            // One allocation and one pass: JSON numbers go straight into the
            // matrix's column-major storage.
            let a = DMatrix::from_row_iterator(n, n, input["a"].as_array().expect("array").iter().map(|x| x.as_f64().expect("number")));
            Ok::<_, Infallible>(a.try_inverse().expect("matrix is invertible"))
        },
        |inverse| inverse.len() as u32,
        // Storage is column-major; the transpose iterates in row-major order.
        |inverse| json!(inverse.transpose().iter().copied().collect::<Vec<f64>>()),
    );
}
