use serde_json::{Value, json};
use x509_parser::prelude::*;
#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

struct Fields {
    serial: String,
    subject_cn: String,
    issuer_cn: String,
    subject_attrs: usize,
    issuer_attrs: usize,
    not_before: i64,
    not_after: i64,
    extensions: usize,
    version: u32,
}

// Not timed: prepare() decodes each fixture from hex once.
fn unhex(s: &str) -> Vec<u8> {
    let nib = |c: u8| if c <= b'9' { c - b'0' } else { c - b'a' + 10 };
    s.as_bytes().chunks(2).map(|p| (nib(p[0]) << 4) | nib(p[1])).collect()
}

fn cn(name: &X509Name) -> String {
    name.iter_common_name().next().and_then(|a| a.as_str().ok()).unwrap_or("").to_string()
}

fn main() {
    bench_harness::operation::run_prepared(
        |value| unhex(value.as_str().expect("string fixture")),
        |bytes: &Vec<u8>| {
            let (_, c) = X509Certificate::from_der(bytes).map_err(|e| e.to_string())?;
            Ok::<_, String>(Fields {
                version: c.version().0 + 1,
                serial: c.tbs_certificate.serial.to_str_radix(16),
                subject_cn: cn(c.subject()),
                issuer_cn: cn(c.issuer()),
                subject_attrs: c.subject().iter_attributes().count(),
                issuer_attrs: c.issuer().iter_attributes().count(),
                not_before: c.validity().not_before.timestamp(),
                not_after: c.validity().not_after.timestamp(),
                extensions: c.extensions().len(),
            })
        },
        |f| f.extensions as u32,
        |_, f| {
            json!({
                "version": f.version, "serial": f.serial, "subjectCN": f.subject_cn,
                "issuerCN": f.issuer_cn, "subjectAttrs": f.subject_attrs,
                "issuerAttrs": f.issuer_attrs, "notBefore": f.not_before,
                "notAfter": f.not_after, "extensions": f.extensions,
            }) as Value
        },
    );
}
