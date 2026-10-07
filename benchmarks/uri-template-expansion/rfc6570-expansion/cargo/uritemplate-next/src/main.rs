use serde_json::Value;
use uritemplate::{TemplateVar, UriTemplate};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The variables as the crate's own values, built once per fixture.
fn prepare(input: &Value) -> (String, Vec<(String, TemplateVar)>) {
    let text = |v: &Value| v.as_str().expect("string").to_owned();
    let vars = input["vars"].as_object().expect("vars object").iter().map(|(name, value)| (name.clone(), match value {
        Value::String(s) => TemplateVar::Scalar(s.clone()),
        Value::Array(items) => TemplateVar::List(items.iter().map(text).collect()),
        Value::Object(pairs) => TemplateVar::AssociativeArray(pairs.iter().map(|(k, v)| (k.clone(), text(v))).collect()),
        _ => panic!("unexpected variable type"),
    })).collect();
    (input["template"].as_str().expect("template").to_owned(), vars)
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(template, vars)| {
            // The crate keeps the variables inside the template object, so
            // each call parses the template, sets every variable and builds.
            let mut template = UriTemplate::new(template);
            for (name, value) in vars { template.set(name, value.clone()); }
            Ok::<_, String>(template.build())
        },
        |out| out.len() as u32,
        |_, out| Value::String(out.clone()),
    );
}
