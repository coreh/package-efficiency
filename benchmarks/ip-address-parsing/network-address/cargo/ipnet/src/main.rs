use ipnet::IpNet;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        let net: IpNet = input.parse().unwrap();
        Ok(net.network().to_string())
    });
}
