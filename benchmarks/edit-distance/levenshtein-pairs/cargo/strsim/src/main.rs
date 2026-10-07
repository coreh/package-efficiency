#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |pair| {
            let a = pair[0].as_str().ok_or("string fixture")?;
            let b = pair[1].as_str().ok_or("string fixture")?;
            Ok::<usize, &str>(strsim::levenshtein(a, b))
        },
        |distance| *distance as u32,
        |distance| (*distance).into(),
    );
}
