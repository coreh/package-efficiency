use tinytemplate::TinyTemplate;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const TEMPLATE: &str = r#"<section title="{ title }"><h1>{ title }</h1><p>By { author }</p><ul>
{{ for item in items }}<li id="item-{ item.id }" class="item{{ if item.featured }} featured{{ endif }}" title="{ item.name }"><b>{ item.name }</b> <span>{ item.price }</span>{{ if item.note }}<em>{ item.note }</em>{{ endif }}{{ for tag in item.tags }}<i>{ tag }</i>{{ endfor }}</li>
{{ endfor }}</ul><p>{ count } items</p></section>"#;

fn main() {
    // One engine for the whole run; add_template compiles the source again in
    // every call and replaces the previous compiled template of the same name.
    let engine = std::cell::RefCell::new(TinyTemplate::new());
    bench_harness::operation::run_with_external_verification(|value| {
        let mut tt = engine.borrow_mut();
        tt.add_template("t", TEMPLATE).expect("template compiles");
        tt.render("t", value).map_err(serde::de::Error::custom)
    });
}
