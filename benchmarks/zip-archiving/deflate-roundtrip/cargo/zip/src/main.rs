use serde_json::{Value, json};
use std::io::{Cursor, Read, Write};
use zip::{ZipArchive, ZipWriter, write::SimpleFileOptions};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Error = Box<dyn std::error::Error>;

fn main() {
    bench_harness::operation::run_value(
        |input| -> Result<(usize, Vec<(String, String)>), Error> {
            let mut writer = ZipWriter::new(Cursor::new(Vec::new()));
            for entry in input.as_array().expect("entry list") {
                writer.start_file(entry["name"].as_str().expect("name"), SimpleFileOptions::default())?;
                writer.write_all(entry["text"].as_str().expect("text").as_bytes())?;
            }
            let bytes = writer.finish()?.into_inner();
            let archive_bytes = bytes.len();
            let mut archive = ZipArchive::new(Cursor::new(bytes))?;
            let mut entries = Vec::with_capacity(archive.len());
            for i in 0..archive.len() {
                let mut file = archive.by_index(i)?;
                let mut text = String::new();
                file.read_to_string(&mut text)?;
                entries.push((file.name().to_owned(), text));
            }
            Ok((archive_bytes, entries))
        },
        |(_, entries)| entries.len() as u32,
        |(archive_bytes, entries)| json!({
            "archiveBytes": archive_bytes,
            "entries": entries.iter().map(|(name, text)| json!({"name": name, "text": text})).collect::<Vec<Value>>(),
        }),
    );
}
