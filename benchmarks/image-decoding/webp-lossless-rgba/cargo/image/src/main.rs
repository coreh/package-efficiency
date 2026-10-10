use base64::Engine;
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Image {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

// Untimed, once per fixture: the hex string becomes the file's bytes.
fn unhex(v: &serde_json::Value) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    v.as_str().expect("string fixture").as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        unhex,
        |bytes| -> Result<Image, image::ImageError> {
            let img = image::load_from_memory_with_format(&bytes[..], image::ImageFormat::WebP)?;
            Ok(Image { width: img.width(), height: img.height(), data: img.into_bytes() })
        },
        |image| image.data.len() as u32,
        // Verifier only (not timed).
        |_, image| json!({
            "width": image.width,
            "height": image.height,
            "data": base64::engine::general_purpose::STANDARD.encode(&image.data),
        }),
    );
}
