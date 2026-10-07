#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let from = value[0].as_str().expect("string fixture");
        let to = value[1].as_str().expect("string fixture");
        let diff = pathdiff::diff_paths(to, from).expect("absolute paths");
        // The PathBuf's own buffer becomes the String: no second allocation or copy.
        Ok(diff.into_os_string().into_string().expect("UTF-8 path"))
    });
}
