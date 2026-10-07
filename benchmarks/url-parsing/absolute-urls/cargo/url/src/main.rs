use serde_json::json;
use url::Url;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| Url::parse(value.as_str().expect("string fixture")),
        |url| url.host_str().map_or(0, |host| host.len() as u32),
        // For the verifier only, outside measured work.
        |url| {
            let userinfo = match url.password() {
                Some(password) => format!("{}:{password}", url.username()),
                None => url.username().to_owned(),
            };
            json!({
                "scheme": url.scheme(),
                "userinfo": userinfo,
                "host": url.host_str(),
                "port": url.port().map(|port| port.to_string()),
                "path": url.path(),
                "query": url.query(),
                "fragment": url.fragment(),
            })
        },
    );
}
