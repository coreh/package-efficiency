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

fn summarize(input: &str) -> Result<Summary, roxmltree::Error> {
    let document = roxmltree::Document::parse(input)?;
    let mut s = Summary { elements: 0, attributes: 0, text: 0 };
    for node in document.descendants() {
        if node.is_element() {
            s.elements += 1;
            for attribute in node.attributes() {
                s.attributes += code_points(attribute.value());
            }
        } else if node.is_text() {
            s.text += non_space(node.text().unwrap_or_default());
        }
    }
    Ok(s)
}

fn main() {
    bench_harness::operation::run_value(
        |value| summarize(value.as_str().expect("string fixture")),
        |s| s.elements + s.attributes + s.text,
        |s| serde_json::json!({ "elements": s.elements, "attributes": s.attributes, "text": s.text }),
    );
}
