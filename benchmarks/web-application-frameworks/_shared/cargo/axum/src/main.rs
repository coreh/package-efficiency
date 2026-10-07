//! The sample application on axum: its router, its extractors, its `Json`
//! and `Html` responses, and MiniJinja templates held in the router's state,
//! as in axum's own templates-minijinja example.
use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{Html, Json};
use axum::{Router, routing::get};
use minijinja::{Environment, context};

mod catalog;
use catalog::{Item, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

type Templates = Arc<Environment<'static>>;

fn templates() -> Environment<'static> {
    let mut env = Environment::new();
    env.add_template("base.html", include_str!("../templates/base.html")).unwrap();
    env.add_template("about.html", include_str!("../templates/about.html")).unwrap();
    env.add_template("item.html", include_str!("../templates/item.html")).unwrap();
    env.add_filter("price", price);
    env
}

fn render(templates: &Environment<'static>, name: &str, context: minijinja::Value) -> Result<Html<String>, StatusCode> {
    let template = templates.get_template(name).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    template.render(context).map(Html).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

async fn about(State(templates): State<Templates>) -> Result<Html<String>, StatusCode> {
    render(&templates, "about.html", context! {})
}

async fn item_page(State(templates): State<Templates>, Path(id): Path<u64>) -> Result<Html<String>, StatusCode> {
    render(&templates, "item.html", context! { item => item(id) })
}

async fn item_api(Path(id): Path<u64>) -> Json<Item> {
    Json(item(id))
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    let app = Router::new()
        .route("/about", get(about))
        .route("/items/{id}", get(item_page))
        .route("/api/items/{id}", get(item_api))
        .with_state(Arc::new(templates()));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    axum::serve(listener, app).await.unwrap();
}
