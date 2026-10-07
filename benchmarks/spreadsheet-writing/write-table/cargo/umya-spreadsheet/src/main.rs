use serde_json::Value;
use std::io::Cursor;
use umya_spreadsheet::{new_file_empty_worksheet, writer};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let mut book = new_file_empty_worksheet();
            for sheet in value["sheets"].as_array().expect("sheets") {
                let worksheet = book.new_sheet(sheet["name"].as_str().expect("name"))?;
                for (y, row) in sheet["rows"].as_array().expect("rows").iter().enumerate() {
                    for (x, cell) in row.as_array().expect("row").iter().enumerate() {
                        let target = worksheet.get_cell_mut((x as u32 + 1, y as u32 + 1));
                        match cell {
                            Value::String(s) => target.set_value_string(s.as_str()),
                            Value::Number(n) => target.set_value_number(n.as_f64().expect("f64")),
                            _ => unreachable!(),
                        };
                    }
                }
            }
            let mut out = Cursor::new(Vec::new());
            writer::xlsx::write_writer(&book, &mut out)?;
            Ok(out.into_inner())
        },
        |bytes| bytes.len() as u32,
        // Verifier only (not timed): the bytes as a list of integers.
        |bytes| serde_json::json!(bytes),
    );
}
