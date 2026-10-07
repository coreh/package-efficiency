use xml::reader::{EventReader, XmlEvent};
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

fn summarize(input: &str) -> Result<Summary, xml::reader::Error> {
    let mut s = Summary::default();
    // 1 inside price, 2 inside description.
    let mut inside = 0;
    let mut price = String::new();
    for event in EventReader::from_str(input) {
        match event? {
            XmlEvent::StartElement { name, attributes, .. } => match name.local_name.as_str() {
                "product" => {
                    s.products += 1;
                    if attributes.iter().any(|a| a.name.local_name == "stock" && a.value == "true") {
                        s.in_stock += 1;
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
            XmlEvent::EndElement { name } => {
                if name.local_name == "price" {
                    s.cents += price.parse::<u32>().expect("integer price");
                }
                if name.local_name == "price" || name.local_name == "description" {
                    inside = 0;
                }
            }
            XmlEvent::Characters(text) | XmlEvent::CData(text) => {
                if inside == 1 {
                    price.push_str(&text);
                } else if inside == 2 {
                    s.description_chars += non_space(&text);
                }
            }
            _ => (),
        }
    }
    Ok(s)
}

fn main() {
    bench_harness::operation::run_value(
        |value| summarize(value.as_str().expect("string fixture")),
        |s| s.products + s.in_stock + s.cents + s.tags + s.description_chars,
        |s| serde_json::json!({ "products": s.products, "inStock": s.in_stock, "cents": s.cents, "tags": s.tags, "descriptionChars": s.description_chars }),
    );
}
