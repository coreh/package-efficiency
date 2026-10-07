#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_with_external_verification(|value| {
        let input = value.as_str().expect("string fixture");
        let parser = pulldown_cmark::Parser::new(input);
        let mut out = String::new();
        pulldown_cmark::html::push_html(&mut out, parser);
        Ok(out)
    });
}
