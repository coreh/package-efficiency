use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let color = value.as_str().expect("string fixture").parse::<css_color::Srgb>().map_err(|_| "unparsable color")?;
            Ok::<_, &str>([color.red * 255.0, color.green * 255.0, color.blue * 255.0, color.alpha])
        },
        |rgba| u32::from(rgba[3] == 1.0),
        |rgba| json!([rgba[0], rgba[1], rgba[2]]),
    );
}
