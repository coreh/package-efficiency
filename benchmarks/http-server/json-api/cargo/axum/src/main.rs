use axum::{
    Json, Router,
    extract::Path,
    routing::{get, post},
};
use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

async fn user(Path(id): Path<u64>) -> Json<Value> {
    Json(json!({ "id": id, "name": format!("User {id}") }))
}

async fn echo(Json(body): Json<Value>) -> Json<Value> {
    Json(json!({ "echo": body }))
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/users/{id}", get(user))
        .route("/echo", post(echo));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    axum::serve(listener, app).await.unwrap();
}
