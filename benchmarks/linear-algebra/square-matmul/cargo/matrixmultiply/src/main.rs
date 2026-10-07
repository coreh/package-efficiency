use serde_json::{Value, json};
use std::convert::Infallible;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn floats(value: &Value) -> Vec<f64> {
    value.as_array().expect("array").iter().map(|x| x.as_f64().expect("number")).collect()
}

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let n = input["n"].as_u64().expect("n") as usize;
            let (a, b) = (floats(&input["a"]), floats(&input["b"]));
            let mut c = vec![0.0f64; n * n];
            let s = n as isize;
            unsafe { matrixmultiply::dgemm(n, n, n, 1.0, a.as_ptr(), s, 1, b.as_ptr(), s, 1, 0.0, c.as_mut_ptr(), s, 1) };
            Ok::<_, Infallible>(c)
        },
        |product| product.len() as u32,
        |product| json!(product),
    );
}
