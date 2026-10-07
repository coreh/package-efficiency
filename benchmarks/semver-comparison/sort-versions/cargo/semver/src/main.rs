#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    // Result: indices into the input in ascending precedence order.
    bench_harness::operation::run_value_with_input(
        |input| -> Result<Vec<usize>, semver::Error> {
            let list = input.as_array().expect("array of strings");
            let mut parsed = list
                .iter()
                .enumerate()
                .map(|(i, s)| semver::Version::parse(s.as_str().expect("string")).map(|v| (i, v)))
                .collect::<Result<Vec<_>, _>>()?;
            parsed.sort_by(|a, b| a.1.cmp_precedence(&b.1));
            Ok(parsed.into_iter().map(|(i, _)| i).collect())
        },
        |order| order.len() as u32,
        |input, order| {
            let list = input.as_array().unwrap();
            serde_json::Value::Array(order.iter().map(|&i| list[i].clone()).collect())
        },
    );
}
