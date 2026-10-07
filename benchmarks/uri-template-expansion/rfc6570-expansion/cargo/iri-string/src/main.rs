use iri_string::spec::UriSpec;
use iri_string::template::UriTemplateStr;
use iri_string::template::simple_context::{SimpleContext, Value as Var};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The variables are handed over as the crate's own context, built once per
// fixture, the way the JavaScript packages are handed a ready object.
fn prepare(input: &Value) -> (String, SimpleContext) {
    let mut context = SimpleContext::new();
    for (name, value) in input["vars"].as_object().expect("vars object") {
        let text = |v: &Value| v.as_str().expect("string").to_owned();
        context.insert(name.as_str(), match value {
            Value::String(s) => Var::String(s.clone()),
            Value::Array(items) => Var::List(items.iter().map(text).collect()),
            Value::Object(pairs) => Var::Assoc(pairs.iter().map(|(k, v)| (k.clone(), text(v))).collect()),
            _ => panic!("unexpected variable type"),
        });
    }
    (input["template"].as_str().expect("template").to_owned(), context)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(template, context)| {
            let template = UriTemplateStr::new(template).map_err(|e| e.to_string())?;
            Ok::<_, String>(template.expand::<UriSpec, _>(context).map_err(|e| e.to_string())?.to_string())
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.clone()),
    );
}
