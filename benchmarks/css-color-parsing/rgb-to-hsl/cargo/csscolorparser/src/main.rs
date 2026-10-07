use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    bench_harness::operation::run_value(
        |value| {
            let c = value.as_array().expect("array fixture");
            let channel = |i: usize| c[i].as_u64().expect("integer channel") as u8;
            let [h, s, l, _] = csscolorparser::Color::from_rgba8(channel(0), channel(1), channel(2), 255).to_hsla();
            Ok::<_, &str>([h, s * 100.0, l * 100.0])
        },
        |hsl| hsl.len() as u32,
        |hsl| json!([hsl[0], hsl[1], hsl[2]]),
    );
}
