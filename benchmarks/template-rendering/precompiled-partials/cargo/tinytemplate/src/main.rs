use tinytemplate::TinyTemplate;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const ROW: &str = r#"<tr class="row{{ if rush }} rush{{ endif }}"><td>{ sku }</td><td>{ name }</td><td>{ qty }</td><td>{ price }</td><td>{{ if rush }}Rush: { reason }{{ else }}Standard{{ endif }}</td></tr>"#;
const PAGE: &str = r#"<article><h1>{ title }</h1><address>{ customer.name } &lt;{ customer.email }&gt;, { customer.address.city }</address><table>
{{ for row in rows }}{{ call row with row }}
{{ endfor }}</table><footer>{ footer } - { total }</footer></article>"#;

fn main() {
    let mut tt = TinyTemplate::new();
    tt.add_template("row", ROW).expect("row compiles");
    tt.add_template("page", PAGE).expect("page compiles");
    bench_harness::operation::run_with_external_verification(|value| {
        tt.render("page", value).map_err(serde::de::Error::custom)
    });
}
