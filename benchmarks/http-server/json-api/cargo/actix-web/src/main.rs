use actix_web::{App, HttpServer, web};
use serde_json::{Value, json};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

async fn hello() -> &'static str {
    "Hello, World!"
}

async fn user(id: web::Path<u64>) -> web::Json<Value> {
    let id = id.into_inner();
    web::Json(json!({ "id": id, "name": format!("User {id}") }))
}

async fn echo(body: web::Json<Value>) -> web::Json<Value> {
    web::Json(json!({ "echo": body.into_inner() }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    bench_harness::boot();
    let server = HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(hello))
            .route("/users/{id}", web::get().to(user))
            .route("/echo", web::post().to(echo))
    })
    .bind(("127.0.0.1", 0))?;

    bench_harness::ready(server.addrs()[0].port());
    server.run().await
}
