use calamine::{Data, Reader, Xlsx};
use serde_json::json;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// Untimed, once per fixture: the hex string becomes the file's bytes.
fn unhex(v: &serde_json::Value) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    v.as_str().expect("string fixture").as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn main() {
    bench_harness::operation::run_prepared(
        unhex,
        |bytes| -> Result<Vec<(String, calamine::Range<Data>)>, calamine::XlsxError> {
            let mut book: Xlsx<_> = calamine::open_workbook_from_rs(std::io::Cursor::new(&bytes[..]))?;
            Ok(book.worksheets())
        },
        |sheets| sheets.len() as u32,
        // Verifier only (not timed).
        |_, sheets| {
            serde_json::Value::Array(
                sheets
                    .iter()
                    .map(|(name, range)| {
                        let rows: Vec<serde_json::Value> = range
                            .rows()
                            .map(|row| {
                                serde_json::Value::Array(
                                    row.iter()
                                        .map(|d| match d {
                                            Data::Int(i) => json!(i),
                                            Data::Float(f) => json!(f),
                                            Data::String(s) => json!(s),
                                            Data::Bool(b) => json!(b),
                                            _ => serde_json::Value::Null,
                                        })
                                        .collect(),
                                )
                            })
                            .collect();
                        json!({ "name": name, "rows": rows })
                    })
                    .collect(),
            )
        },
    );
}
