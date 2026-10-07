//! The sample application on Dioxus fullstack: components rendered on the
//! server, Dioxus's own router for the pages, and a server function with a
//! path of its own for the API. `dioxus::server::router` is the axum router
//! that `dioxus::launch` serves; it is served here on a listener of our own
//! so that the harness can be told the port.
use dioxus::prelude::*;

mod catalog;
use catalog::{Item, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Routable, Clone, PartialEq)]
enum Route {
    #[route("/about")]
    About {},
    #[route("/items/:id")]
    ItemPage { id: u64 },
}

#[allow(non_snake_case)]
fn App() -> Element {
    rsx! {
        Router::<Route> {}
    }
}

#[get("/api/items/:id")]
async fn item_api(id: u64) -> Result<Item> {
    Ok(item(id))
}

#[component]
fn About() -> Element {
    rsx! {
        main { id: "bench",
            h1 { "About this shop" }
            p { "This page is the same for every visitor." }
            ul { class: "facts",
                li { "One static page" }
                li { "One dynamic page" }
                li { "One API route" }
            }
        }
    }
}

#[component]
fn ItemPage(id: u64) -> Element {
    let item = item(id);
    rsx! {
        main { id: "bench", "data-item": "{item.id}",
            h1 { "{item.name}" }
            p { class: "price", {price(item.price_cents)} }
            if item.in_stock {
                p { class: "stock", "In stock" }
            } else {
                p { class: "stock out", "Sold out" }
            }
            if item.discount_percent != 0 {
                p { class: "discount", "Save {item.discount_percent}%" }
            }
            p { class: "note", "{item.note}" }
            ul { class: "tags",
                for tag in item.tags.iter() {
                    li { "{tag}" }
                }
            }
            table { class: "related",
                thead {
                    tr {
                        th { "Item" }
                        th { "Price" }
                    }
                }
                tbody {
                    for related in item.related.iter() {
                        tr {
                            td {
                                a { href: "/items/{related.id}", "{related.name}" }
                            }
                            td { {price(related.price_cents)} }
                        }
                    }
                }
            }
            // Dioxus sends a boolean attribute that is on as hidden=true.
            footer { hidden: true, "rendered" }
        }
    }
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    let app = dioxus::server::router(App);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    axum::serve(listener, app).await.unwrap();
}
