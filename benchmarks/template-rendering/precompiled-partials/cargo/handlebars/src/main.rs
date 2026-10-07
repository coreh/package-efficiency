use handlebars::Handlebars;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const ROW: &str = r#"<tr class="row{{#if rush}} rush{{/if}}"><td>{{sku}}</td><td>{{name}}</td><td>{{qty}}</td><td>{{price}}</td><td>{{#if rush}}Rush: {{reason}}{{else}}Standard{{/if}}</td></tr>"#;
const PAGE: &str = r#"<article><h1>{{title}}</h1><address>{{customer.name}} &lt;{{customer.email}}&gt;, {{customer.address.city}}</address><table>
{{#each rows}}{{> row}}
{{/each}}</table><footer>{{footer}} - {{total}}</footer></article>"#;

fn main() {
    let mut hb = Handlebars::new();
    hb.register_partial("row", ROW).expect("row compiles");
    hb.register_template_string("page", PAGE).expect("page compiles");
    bench_harness::operation::run_with_external_verification(|value| {
        hb.render("page", value).map_err(serde::de::Error::custom)
    });
}
