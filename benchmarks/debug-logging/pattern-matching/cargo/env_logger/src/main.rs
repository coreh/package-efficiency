use env_logger::Builder;
use log::{Level, Log, Metadata};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let filter = Builder::new().parse_filters("app:web:,app:db:,app:cache:,app:auth:,lib:http:,worker:,svc:billing:").build();
    bench_harness::operation::run_prepared(
        |input| input["ns"].as_str().expect("ns").to_owned(),
        |ns: &String| -> Result<bool, String> {
            Ok(filter.enabled(&Metadata::builder().level(Level::Info).target(ns).build()))
        },
        |enabled| u32::from(*enabled),
        |_, enabled| serde_json::Value::Bool(*enabled),
    );
}
