use cookie::{Cookie, SameSite};
use serde_json::json;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

// The task's common shape, built inside the measured call as in every other
// language: Cookie::parse borrows from the input, so the strings are copied
// into an owned result.
struct Parsed {
    name: String,
    value: String,
    path: Option<String>,
    domain: Option<String>,
    max_age: Option<i64>,
    secure: bool,
    http_only: bool,
    same_site: Option<&'static str>,
}

fn parse(header: &str) -> Result<Parsed, String> {
    let c = Cookie::parse(header).map_err(|e| e.to_string())?;
    Ok(Parsed {
        name: c.name().to_owned(),
        value: c.value().to_owned(),
        path: c.path().map(str::to_owned),
        domain: c.domain().map(str::to_owned),
        max_age: c.max_age().map(|d| d.whole_seconds()),
        secure: c.secure().unwrap_or(false),
        http_only: c.http_only().unwrap_or(false),
        same_site: c.same_site().map(|s| match s {
            SameSite::Lax => "lax",
            SameSite::Strict => "strict",
            SameSite::None => "none",
        }),
    })
}

fn main() {
    bench_harness::operation::run_value(
        |value| parse(value.as_str().expect("string fixture")),
        |p| (p.name.len() + p.value.len() + p.max_age.is_some() as usize + p.secure as usize
            + p.same_site.is_some() as usize) as u32,
        |p| json!({
            "name": p.name,
            "value": p.value,
            "path": p.path,
            "domain": p.domain,
            "maxAge": p.max_age,
            "secure": p.secure,
            "httpOnly": p.http_only,
            "sameSite": p.same_site,
        }),
    );
}
