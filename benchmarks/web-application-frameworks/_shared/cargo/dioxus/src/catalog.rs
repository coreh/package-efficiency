//! The shop's data: an item is computed from its id.
use serde::{Deserialize, Serialize};

const TAGS: [&str; 4] = ["alpha", "beta", "gamma", "delta"];

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Related {
    pub id: u64,
    pub name: String,
    pub price_cents: u64,
}

// A server function's result is also what its caller reads back, so it can be
// both written and read.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: u64,
    pub name: String,
    pub price_cents: u64,
    pub in_stock: bool,
    pub discount_percent: u64,
    pub note: String,
    pub tags: Vec<String>,
    pub related: Vec<Related>,
}

fn price_cents(id: u64) -> u64 {
    199 + (id * 37) % 5000
}

pub fn item(id: u64) -> Item {
    Item {
        id,
        name: format!("Item {id}"),
        price_cents: price_cents(id),
        in_stock: id % 3 != 0,
        discount_percent: if id % 5 == 0 { 15 } else { 0 },
        note: format!("Fish & Chips <{id}> \"quoted\" it's"),
        tags: TAGS[..(id % 4) as usize + 1].iter().map(|tag| tag.to_string()).collect(),
        related: (id + 1..=id + 12).map(|id| Related { id, name: format!("Item {id}"), price_cents: price_cents(id) }).collect(),
    }
}

/// A price as shown: 236 cents is `$2.36`.
pub fn price(cents: u64) -> String {
    format!("${}.{:02}", cents / 100, cents % 100)
}
