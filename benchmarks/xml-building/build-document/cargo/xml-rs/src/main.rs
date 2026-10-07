use serde_json::Value;
use xml::writer::{EventWriter, XmlEvent};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn add(writer: &mut EventWriter<Vec<u8>>, node: &Value) -> Result<(), String> {
    let mut start = XmlEvent::start_element(node["name"].as_str().ok_or("name")?);
    for (key, value) in node["attrs"].as_object().ok_or("attrs")? {
        start = start.attr(key.as_str(), value.as_str().ok_or("attribute value")?);
    }
    writer.write(start).map_err(|e| e.to_string())?;
    match node["children"].as_array() {
        Some(children) => for child in children { add(writer, child)? },
        None => writer.write(XmlEvent::characters(node["text"].as_str().ok_or("text")?)).map_err(|e| e.to_string())?,
    }
    writer.write(XmlEvent::end_element()).map_err(|e| e.to_string())
}

fn main() {
    bench_harness::operation::run_value(
        |doc| {
            let mut writer = EventWriter::new(Vec::new());
            add(&mut writer, doc)?;
            String::from_utf8(writer.into_inner()).map_err(|e| e.to_string())
        },
        |out: &String| out.len() as u32,
        |out| Value::String(out.clone()),
    );
}
