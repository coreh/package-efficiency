use base64::Engine;
use printpdf::*;
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const PAGE_WIDTH: f32 = 595.28;
const PAGE_HEIGHT: f32 = 841.89;

struct Page {
    texts: Vec<(f32, f32, String)>,
    rules: Vec<[f32; 4]>,
}

// Untimed, once per fixture: the JSON becomes typed pages.
fn prepare(input: &Value) -> Vec<Page> {
    let f = |v: &Value| v.as_f64().expect("number") as f32;
    input["pages"].as_array().expect("pages").iter().map(|p| Page {
        texts: p["texts"].as_array().expect("texts").iter()
            .map(|t| (f(&t["x"]), f(&t["y"]), t["text"].as_str().expect("text").to_string()))
            .collect(),
        rules: p["rules"].as_array().expect("rules").iter()
            .map(|r| [f(&r[0]), f(&r[1]), f(&r[2]), f(&r[3])])
            .collect(),
    }).collect()
}

fn point(x: f32, y: f32) -> LinePoint {
    // printpdf measures from the bottom-left corner; the input from the top-left.
    LinePoint { p: Point { x: Pt(x), y: Pt(PAGE_HEIGHT - y) }, bezier: false }
}

fn write(pages: &[Page]) -> Vec<u8> {
    let mut doc = PdfDocument::new("write-pages");
    let pages = pages.iter().map(|page| {
        let mut ops = vec![Op::SetFont { font: PdfFontHandle::Builtin(BuiltinFont::Helvetica), size: Pt(10.0) }];
        for (x, y, text) in &page.texts {
            // A text section per line: the text cursor (Td) is relative within a section.
            ops.push(Op::StartTextSection);
            ops.push(Op::SetTextCursor { pos: Point { x: Pt(*x), y: Pt(PAGE_HEIGHT - y) } });
            ops.push(Op::ShowText { items: vec![TextItem::Text(text.clone())] });
            ops.push(Op::EndTextSection);
        }
        for [x1, y1, x2, y2] in &page.rules {
            ops.push(Op::DrawLine { line: Line { points: vec![point(*x1, *y1), point(*x2, *y2)], is_closed: false } });
        }
        PdfPage::new(Mm::from(Pt(PAGE_WIDTH)), Mm::from(Pt(PAGE_HEIGHT)), ops)
    }).collect();
    doc.with_pages(pages).save(&PdfSaveOptions::default(), &mut Vec::new())
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |pages: &Vec<Page>| -> Result<Vec<u8>, String> { Ok(write(pages)) },
        |bytes| bytes.len() as u32,
        // Verifier only (not timed).
        |_, bytes| Value::String(base64::engine::general_purpose::STANDARD.encode(bytes)),
    );
}
