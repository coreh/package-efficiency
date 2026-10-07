use serde_json::{Value, json};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// What the measured call keeps: httparse borrows everything else from the input.
struct Head { method_len: usize, path_len: usize, minor: u8, headers: usize }

fn parse<T>(input: &[u8], read: impl FnOnce(&httparse::Request) -> T) -> Result<T, httparse::Error> {
    let mut headers = [httparse::EMPTY_HEADER; 100];
    let mut req = httparse::Request::new(&mut headers);
    let status = req.parse(input)?;
    assert!(status.is_complete(), "incomplete request head");
    Ok(read(&req))
}

fn main() {
    bench_harness::operation::run_value_with_input(
        |value| parse(value.as_str().expect("string fixture").as_bytes(), |req| Head {
            method_len: req.method.unwrap().len(),
            path_len: req.path.unwrap().len(),
            minor: req.version.unwrap(),
            headers: req.headers.len(),
        }),
        |head| (head.method_len + head.path_len + head.minor as usize + head.headers) as u32,
        // For the verifier only: parse again and copy everything out.
        |value, _| parse(value.as_str().unwrap().as_bytes(), |req| json!({
            "method": req.method.unwrap(),
            "path": req.path.unwrap(),
            "minor": req.version.unwrap(),
            "headers": req.headers.iter().map(|h| json!([h.name, String::from_utf8_lossy(h.value)])).collect::<Vec<Value>>(),
        })).expect("parsed once already"),
    );
}
