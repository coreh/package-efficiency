#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let query = input[0].as_str().ok_or("string query")?;
            let candidates = input[1].as_array().ok_or("candidate list")?;
            let mut best = 0usize;
            let mut best_distance = usize::MAX;
            for (i, candidate) in candidates.iter().enumerate() {
                let candidate = candidate.as_str().ok_or("string candidate")?;
                let d = strsim::levenshtein(query, candidate);
                if d < best_distance {
                    best_distance = d;
                    best = i;
                }
            }
            Ok::<usize, &str>(best)
        },
        |index| *index as u32,
        |index| (*index).into(),
    );
}
