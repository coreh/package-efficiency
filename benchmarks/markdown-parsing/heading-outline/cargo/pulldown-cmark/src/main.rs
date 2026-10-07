use pulldown_cmark::{Event, HeadingLevel, Parser, Tag, TagEnd};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn level(l: HeadingLevel) -> u8 {
    match l {
        HeadingLevel::H1 => 1,
        HeadingLevel::H2 => 2,
        HeadingLevel::H3 => 3,
        HeadingLevel::H4 => 4,
        HeadingLevel::H5 => 5,
        HeadingLevel::H6 => 6,
    }
}

fn main() {
    bench_harness::operation::run_value(
        |value| -> Result<Vec<(u8, String)>, String> {
            let input = value.as_str().expect("string fixture");
            let mut out = Vec::new();
            let mut current: Option<(u8, String)> = None;
            for event in Parser::new(input) {
                match event {
                    Event::Start(Tag::Heading { level: l, .. }) => current = Some((level(l), String::new())),
                    Event::Text(t) => {
                        if let Some((_, s)) = current.as_mut() {
                            s.push_str(&t);
                        }
                    }
                    Event::End(TagEnd::Heading(_)) => out.extend(current.take()),
                    _ => {}
                }
            }
            Ok(out)
        },
        |result| result.len() as u32,
        |result| serde_json::json!(result.iter().map(|(l, t)| serde_json::json!([l, t])).collect::<Vec<_>>()),
    );
}
