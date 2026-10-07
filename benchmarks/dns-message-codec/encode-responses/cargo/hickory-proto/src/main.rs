use hickory_proto::op::{Message, MessageType, OpCode, Query};
use hickory_proto::rr::rdata::{A, AAAA, CNAME, MX, TXT};
use hickory_proto::rr::{Name, RData, Record, RecordType};
use serde_json::Value;

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn rtype(t: &str) -> RecordType {
    match t {
        "A" => RecordType::A,
        "AAAA" => RecordType::AAAA,
        "CNAME" => RecordType::CNAME,
        "MX" => RecordType::MX,
        _ => RecordType::TXT,
    }
}

fn name(v: &Value) -> Result<Name, String> {
    Name::from_ascii(v.as_str().unwrap()).map_err(|e| e.to_string())
}

fn main() {
    bench_harness::operation::run_value(
        |input| {
            let mut m = Message::new(input["id"].as_u64().unwrap() as u16, MessageType::Response, OpCode::Query);
            m.metadata.authoritative = input["aa"].as_bool().unwrap();
            m.metadata.recursion_desired = input["rd"].as_bool().unwrap();
            m.metadata.recursion_available = input["ra"].as_bool().unwrap();
            let q = &input["question"];
            m.add_query(Query::query(name(&q["name"])?, rtype(q["type"].as_str().unwrap())));
            for a in input["answers"].as_array().unwrap() {
                let d = &a["data"];
                let rdata = match a["type"].as_str().unwrap() {
                    "A" => RData::A(A(d.as_str().unwrap().parse().map_err(|e: std::net::AddrParseError| e.to_string())?)),
                    "AAAA" => RData::AAAA(AAAA(d.as_str().unwrap().parse().map_err(|e: std::net::AddrParseError| e.to_string())?)),
                    "CNAME" => RData::CNAME(CNAME(name(d)?)),
                    "MX" => RData::MX(MX::new(d["preference"].as_u64().unwrap() as u16, name(&d["exchange"])?)),
                    _ => RData::TXT(TXT::new(d.as_array().unwrap().iter().map(|s| s.as_str().unwrap().to_string()).collect())),
                };
                m.add_answer(Record::from_rdata(name(&a["name"])?, a["ttl"].as_u64().unwrap() as u32, rdata));
            }
            m.to_vec().map_err(|e| e.to_string())
        },
        |bytes: &Vec<u8>| bytes.len() as u32,
        |bytes| Value::from(bytes.clone()),
    );
}
