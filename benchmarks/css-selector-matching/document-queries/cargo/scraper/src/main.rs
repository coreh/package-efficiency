use ego_tree::NodeId;
use scraper::{Html, Selector};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Prepared { document: Rc<Html>, selector: String }

fn main() {
    // Untimed, once per fixture: the document is parsed (and shared between fixtures).
    let parsed: RefCell<HashMap<String, Rc<Html>>> = RefCell::new(HashMap::new());
    bench_harness::operation::run_prepared(
        |input| {
            let html = input["html"].as_str().expect("html");
            let document = parsed.borrow_mut().entry(html.to_string()).or_insert_with(|| Rc::new(Html::parse_document(html))).clone();
            Prepared { document, selector: input["selector"].as_str().expect("selector").to_string() }
        },
        |p: &Prepared| {
            let selector = Selector::parse(&p.selector).map_err(|e| e.to_string())?;
            Ok::<Vec<NodeId>, String>(p.document.select(&selector).map(|e| e.id()).collect())
        },
        |ids| ids.len() as u32,
        |input, ids| {
            // Untimed: parse again (node ids are deterministic) and read data-n.
            let document = Html::parse_document(input["html"].as_str().unwrap());
            serde_json::Value::Array(ids.iter().map(|id| {
                let node = document.tree.get(*id).unwrap();
                let n: u64 = node.value().as_element().unwrap().attr("data-n").unwrap().parse().unwrap();
                serde_json::json!(n)
            }).collect())
        },
    );
}
