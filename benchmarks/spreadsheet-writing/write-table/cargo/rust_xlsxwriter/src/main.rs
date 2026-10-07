use rust_xlsxwriter::Workbook;
use serde_json::Value;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<u8>, Error> {
            let mut workbook = Workbook::new();
            for sheet in value["sheets"].as_array().expect("sheets") {
                let worksheet = workbook.add_worksheet();
                worksheet.set_name(sheet["name"].as_str().expect("name"))?;
                for (y, row) in sheet["rows"].as_array().expect("rows").iter().enumerate() {
                    for (x, cell) in row.as_array().expect("row").iter().enumerate() {
                        match cell {
                            Value::String(s) => worksheet.write_string(y as u32, x as u16, s)?,
                            Value::Number(n) => worksheet.write_number(y as u32, x as u16, n.as_f64().expect("f64"))?,
                            _ => unreachable!(),
                        };
                    }
                }
            }
            Ok(workbook.save_to_buffer()?)
        },
        |bytes| bytes.len() as u32,
        // Verifier only (not timed): the bytes as a list of integers.
        |bytes| serde_json::json!(bytes),
    );
}
