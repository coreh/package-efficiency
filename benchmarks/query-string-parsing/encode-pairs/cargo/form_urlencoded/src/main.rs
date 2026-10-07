#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let map = value.as_object().expect("object fixture");
        let mut s = form_urlencoded::Serializer::new(String::new());
        for (k, v) in map {
            s.append_pair(k, v.as_str().expect("string value"));
        }
        Ok(s.finish())
    });
}
