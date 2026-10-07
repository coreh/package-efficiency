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
        |bytes| -> Result<Vec<(String, Vec<Vec<String>>)>, umya_spreadsheet::XlsxError> {
            let book = umya_spreadsheet::reader::xlsx::read_reader(std::io::Cursor::new(&bytes[..]), true)?;
            Ok(book
                .get_sheet_collection()
                .iter()
                .map(|sheet| {
                    let (cols, rows) = sheet.get_highest_column_and_row();
                    let data = (1..=rows).map(|r| (1..=cols).map(|c| sheet.get_value((c, r))).collect()).collect();
                    (sheet.get_name().to_string(), data)
                })
                .collect())
        },
        |sheets| sheets.len() as u32,
        // Verifier only (not timed).
        |_, sheets| {
            serde_json::Value::Array(sheets.iter().map(|(name, rows)| json!({ "name": name, "rows": rows })).collect())
        },
    );
}
