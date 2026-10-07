#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_prepared(
        |input| {
            // Copied once and leaked, so the prepared list can be borrowed for 'static.
            let owned: &'static [String] = Box::leak(input.as_array().expect("array").iter().map(|s| s.as_str().expect("string").to_owned()).collect::<Vec<_>>().into_boxed_slice());
            owned.iter().map(String::as_str).collect::<Vec<&'static str>>()
        },
        |list: &Vec<&'static str>| {
            let mut sorted = list.clone();
            sorted.sort_by(|a, b| alphanumeric_sort::compare_str(a, b));
            Ok::<_, std::convert::Infallible>(sorted)
        },
        |sorted| sorted.len() as u32,
        |_, sorted| serde_json::json!(sorted),
    );
}
