use handlebars::Handlebars;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

const TEMPLATE: &str = r#"<section title="{{title}}"><h1>{{title}}</h1><p>By {{author}}</p><ul>
{{#each items}}<li id="item-{{id}}" class="item{{#if featured}} featured{{/if}}" title="{{name}}"><b>{{name}}</b> <span>{{price}}</span>{{#if note}}<em>{{note}}</em>{{/if}}{{#each tags}}<i>{{this}}</i>{{/each}}</li>
{{/each}}</ul><p>{{count}} items</p></section>"#;

fn main() {
    let hb = Handlebars::new();
    bench_harness::operation::run_with_external_verification(|value| {
        hb.render_template(TEMPLATE, value).map_err(serde::de::Error::custom)
    });
}
