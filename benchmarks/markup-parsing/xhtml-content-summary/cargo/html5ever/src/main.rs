use html5ever::parse_document;
use html5ever::tendril::TendrilSink;
use markup5ever_rcdom::{Handle, NodeData, RcDom};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Summary {
    elements: u32,
    attributes: u32,
    text: u32,
}

/// Code points other than space, tab, line feed and carriage return.
fn non_space(s: &str) -> u32 {
    s.chars().filter(|c| !matches!(c, ' ' | '\t' | '\n' | '\r')).count() as u32
}

fn walk(node: &Handle, s: &mut Summary) {
    match &node.data {
        NodeData::Element { attrs, .. } => {
            s.elements += 1;
            for attribute in attrs.borrow().iter() {
                s.attributes += attribute.value.chars().count() as u32;
            }
        }
        NodeData::Text { contents } => s.text += non_space(&contents.borrow()),
        _ => (),
    }
    for child in node.children.borrow().iter() {
        walk(child, s);
    }
}

fn summarize(input: &str) -> Result<Summary, std::convert::Infallible> {
    let dom = parse_document(RcDom::default(), Default::default()).one(input);
    let mut s = Summary { elements: 0, attributes: 0, text: 0 };
    walk(&dom.document, &mut s);
    Ok(s)
}

fn main() {
    bench_harness::operation::run_value(
        |value| summarize(value.as_str().expect("string fixture")),
        |s| s.elements + s.attributes + s.text,
        |s| serde_json::json!({ "elements": s.elements, "attributes": s.attributes, "text": s.text }),
    );
}
