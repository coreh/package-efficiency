use base64::Engine;
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

enum Arg {
    Text(String),
    Int(i64),
}

struct Lookup {
    msgid: String,
    plural: Option<String>,
    n: u64,
    args: Vec<Arg>,
}

// Not timed: the .mo bytes are parsed once per fixture, and the lookups are read out of JSON.
fn prepare(input: &Value) -> (gettext::Catalog, Vec<Lookup>) {
    let bytes = base64::engine::general_purpose::STANDARD.decode(input["mo"].as_str().expect("mo")).expect("base64");
    let catalog = gettext::Catalog::parse(&bytes[..]).expect("catalog");
    let lookups = input["lookups"].as_array().expect("lookups").iter().map(|l| Lookup {
        msgid: l["msgid"].as_str().expect("msgid").to_owned(),
        plural: l["plural"].as_str().map(str::to_owned),
        n: l["n"].as_u64().unwrap_or(0),
        args: l["args"].as_array().expect("args").iter().map(|a| match a {
            Value::String(s) => Arg::Text(s.clone()),
            other => Arg::Int(other.as_i64().expect("integer")),
        }).collect(),
    }).collect();
    (catalog, lookups)
}

// Fills %s and %d in order, the way printf does in the other languages.
fn fill(format: &str, args: &[Arg]) -> String {
    let mut out = String::with_capacity(format.len() + 16);
    let mut args = args.iter();
    let mut chars = format.chars();
    while let Some(c) = chars.next() {
        if c != '%' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('s') | Some('d') => match args.next() {
                Some(Arg::Text(s)) => out.push_str(s),
                Some(Arg::Int(i)) => out.push_str(&i.to_string()),
                None => {}
            },
            Some(other) => { out.push('%'); out.push(other); }
            None => out.push('%'),
        }
    }
    out
}

fn main() {
    bench_harness::operation::run_prepared(
        prepare,
        |(catalog, lookups)| {
            Ok::<_, String>(lookups.iter().map(|l| {
                let text = match &l.plural {
                    None => catalog.gettext(&l.msgid),
                    Some(plural) => catalog.ngettext(&l.msgid, plural, l.n),
                };
                fill(text, &l.args)
            }).collect::<Vec<String>>())
        },
        |out| out.len() as u32,
        |_, out| Value::Array(out.iter().cloned().map(Value::String).collect()),
    );
}
