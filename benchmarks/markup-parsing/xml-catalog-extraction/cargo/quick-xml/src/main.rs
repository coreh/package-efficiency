use quick_xml::{Reader, XmlVersion, escape::resolve_predefined_entity, events::Event};
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Default)]
struct Summary {
    products: u32,
    in_stock: u32,
    cents: u32,
    tags: u32,
    description_chars: u32,
}

/// Code points other than space, tab, line feed and carriage return.
fn non_space(s: &str) -> u32 {
    s.chars().filter(|c| !matches!(c, ' ' | '\t' | '\n' | '\r')).count() as u32
}

fn summarize(input: &str) -> Result<Summary, quick_xml::Error> {
    let mut reader = Reader::from_str(input);
    let mut s = Summary::default();
    // 1 inside price, 2 inside description.
    let mut inside = 0;
    let mut price = String::new();
    loop {
        match reader.read_event()? {
            Event::Start(start) => match start.name().as_ref() {
                "product" => {
                    s.products += 1;
                    for attribute in start.attributes() {
                        let attribute = attribute?;
                        if attribute.key.as_ref() == "stock" && attribute.normalized_value(XmlVersion::Implicit1_0)? == "true" {
                            s.in_stock += 1;
                        }
                    }
                }
                "tag" => s.tags += 1,
                "price" => {
                    inside = 1;
                    price.clear();
                }
                "description" => inside = 2,
                _ => (),
            },
            Event::End(end) => {
                let name = end.name();
                if name.as_ref() == "price" {
                    s.cents += price.parse::<u32>().expect("integer price");
                }
                if name.as_ref() == "price" || name.as_ref() == "description" {
                    inside = 0;
                }
            }
            Event::Text(text) => {
                let text = text.xml10_content();
                if inside == 1 {
                    price.push_str(&text);
                } else if inside == 2 {
                    s.description_chars += non_space(&text);
                }
            }
            Event::CData(data) => {
                let text = data.xml10_content();
                if inside == 1 {
                    price.push_str(&text);
                } else if inside == 2 {
                    s.description_chars += non_space(&text);
                }
            }
            // A reference in text is its own event, resolved by the caller.
            Event::GeneralRef(reference) => {
                let mut buf = [0u8; 4];
                let text: &str = match reference.resolve_char_ref()? {
                    Some(c) => c.encode_utf8(&mut buf),
                    None => resolve_predefined_entity(&reference).unwrap_or_default(),
                };
                if inside == 1 {
                    price.push_str(text);
                } else if inside == 2 {
                    s.description_chars += non_space(text);
                }
            }
            Event::Eof => return Ok(s),
            _ => (),
        }
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| summarize(value.as_str().expect("string fixture")),
        |s| s.products + s.in_stock + s.cents + s.tags + s.description_chars,
        |s| serde_json::json!({ "products": s.products, "inStock": s.in_stock, "cents": s.cents, "tags": s.tags, "descriptionChars": s.description_chars }),
    );
}
