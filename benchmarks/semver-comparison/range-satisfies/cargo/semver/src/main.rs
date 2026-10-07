#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_bool(|pair| {
        let version = semver::Version::parse(pair[0].as_str().expect("version string")).expect("valid version");
        let req = semver::VersionReq::parse(pair[1].as_str().expect("range string")).expect("valid range");
        req.matches(&version)
    });
}
