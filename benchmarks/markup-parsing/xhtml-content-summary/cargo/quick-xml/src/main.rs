use quick_xml::{Reader, XmlVersion, escape::resolve_predefined_entity, events::{BytesStart, Event}};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Summary {
    elements: u32,
    attributes: u32,
    text: u32,
}

/// Unicode code points.
fn code_points(s: &str) -> u32 {
    s.chars().count() as u32
}

/// Code points other than space, tab, line feed and carriage return.
fn non_space(s: &str) -> u32 {
    s.chars().filter(|c| !matches!(c, ' ' | '\t' | '\n' | '\r')).count() as u32
}

fn element(start: &BytesStart, s: &mut Summary) -> Result<(), quick_xml::Error> {
    s.elements += 1;
    for attribute in start.attributes() {
        s.attributes += code_points(&attribute?.normalized_value(XmlVersion::Implicit1_0)?);
    }
    Ok(())
}

fn summarize(input: &str) -> Result<Summary, quick_xml::Error> {
    let mut reader = Reader::from_str(input);
    let mut s = Summary { elements: 0, attributes: 0, text: 0 };
    loop {
        match reader.read_event()? {
            Event::Start(start) | Event::Empty(start) => element(&start, &mut s)?,
            Event::Text(text) => s.text += non_space(&text.xml10_content()),
            // Since 0.38 a reference in text is its own event, resolved by the caller.
            Event::GeneralRef(reference) => match reference.resolve_char_ref()? {
                Some(c) => s.text += non_space(c.encode_utf8(&mut [0; 4])),
                None => s.text += non_space(resolve_predefined_entity(&reference).unwrap_or_default()),
            },
            Event::Eof => return Ok(s),
            _ => (),
        }
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| summarize(value.as_str().expect("string fixture")),
        |s| s.elements + s.attributes + s.text,
        |s| serde_json::json!({ "elements": s.elements, "attributes": s.attributes, "text": s.text }),
    );
}
