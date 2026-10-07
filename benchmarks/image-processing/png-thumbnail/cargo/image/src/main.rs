use base64::Engine;
use image::{ImageFormat, imageops::FilterType};
use serde_json::Value;
use std::io::Cursor;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the hex string becomes the file's bytes.
fn prepare(input: &Value) -> (Vec<u8>, u32, u32) {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    let bytes = input["png"].as_str().expect("png hex").as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect();
    (bytes, input["width"].as_u64().expect("width") as u32, input["height"].as_u64().expect("height") as u32)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(bytes, width, height)| -> Result<Vec<u8>, image::ImageError> {
            let small = image::load_from_memory(bytes)?.resize_exact(*width, *height, FilterType::Lanczos3);
            let mut out = Cursor::new(Vec::new());
            small.write_to(&mut out, ImageFormat::Png)?;
            Ok(out.into_inner())
        },
        |out| out.len() as u32,
        // Verifier only (not timed).
        |_, out| Value::String(base64::engine::general_purpose::STANDARD.encode(out)),
    );
}
