use quick_xml::Writer;
use quick_xml::events::{BytesEnd, BytesStart, BytesText, Event};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn add(writer: &mut Writer<Vec<u8>>, node: &Value) -> Result<(), String> {
    let name = node["name"].as_str().ok_or("name")?;
    let mut start = BytesStart::new(name);
    for (key, value) in node["attrs"].as_object().ok_or("attrs")? {
        start.push_attribute((key.as_str(), value.as_str().ok_or("attribute value")?));
    }
    writer.write_event(Event::Start(start)).map_err(|e| e.to_string())?;
    match node["children"].as_array() {
        Some(children) => for child in children { add(writer, child)? },
        None => writer.write_event(Event::Text(BytesText::new(node["text"].as_str().ok_or("text")?))).map_err(|e| e.to_string())?,
    }
    writer.write_event(Event::End(BytesEnd::new(name))).map_err(|e| e.to_string())
}

fn main() {
    bench_harness::operation::run_value(
        |doc| {
            let mut writer = Writer::new(Vec::new());
            add(&mut writer, doc)?;
            String::from_utf8(writer.into_inner()).map_err(|e| e.to_string())
        },
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
