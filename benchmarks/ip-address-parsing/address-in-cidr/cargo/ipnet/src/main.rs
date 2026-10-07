use ipnet::IpNet;
use std::net::IpAddr;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |pair| {
            let addr: IpAddr = pair[0].as_str().unwrap().parse().unwrap();
            let net: IpNet = pair[1].as_str().unwrap().parse().unwrap();
            Ok::<bool, std::convert::Infallible>(net.contains(&addr))
        },
        |result| u32::from(*result),
        |result| serde_json::Value::Bool(*result),
    );
}
