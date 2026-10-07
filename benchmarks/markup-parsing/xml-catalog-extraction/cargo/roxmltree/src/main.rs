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

fn summarize(input: &str) -> Result<Summary, roxmltree::Error> {
    let document = roxmltree::Document::parse(input)?;
    let mut s = Summary::default();
    for node in document.descendants().filter(|n| n.is_element()) {
        match node.tag_name().name() {
            "product" => {
                s.products += 1;
                if node.attribute("stock") == Some("true") {
                    s.in_stock += 1;
                }
            }
            "tag" => s.tags += 1,
            "price" => s.cents += node.text().unwrap_or_default().parse::<u32>().expect("integer price"),
            "description" => s.description_chars += non_space(node.text().unwrap_or_default()),
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
