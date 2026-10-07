//! The sample application on Actix Web: its router, its extractors, its
//! `Json` responder, and Tera templates shared as application data, as in
//! the templating example of actix/examples.
use actix_web::error::ErrorInternalServerError;
use actix_web::http::header::ContentType;
use actix_web::{App, HttpResponse, HttpServer, Result, web};
use tera::{Context, Kwargs, State, Tera};

mod catalog;
use catalog::{Item, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn templates() -> Tera {
    let mut tera = Tera::new();
    // Before the templates: Tera checks the filters a template names when it is added.
    tera.register_filter("price", |cents: u64, _: Kwargs, _: &State| price(cents));
    tera.add_raw_templates([
        ("base.html", include_str!("../templates/base.html")),
        ("about.html", include_str!("../templates/about.html")),
        ("item.html", include_str!("../templates/item.html")),
    ])
    .unwrap();
    tera
}

fn page(tera: &Tera, name: &str, context: &Context) -> Result<HttpResponse> {
    let body = tera.render(name, context).map_err(ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().content_type(ContentType::html()).body(body))
}

async fn about(tera: web::Data<Tera>) -> Result<HttpResponse> {
    page(&tera, "about.html", &Context::new())
}

async fn item_page(tera: web::Data<Tera>, id: web::Path<u64>) -> Result<HttpResponse> {
    let mut context = Context::new();
    context.insert("item", &item(id.into_inner()));
    page(&tera, "item.html", &context)
}

async fn item_api(id: web::Path<u64>) -> web::Json<Item> {
    web::Json(item(id.into_inner()))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    bench_harness::boot();
    // The templates are parsed once and shared by the worker threads.
    let tera = web::Data::new(templates());
    let server = HttpServer::new(move || {
        App::new()
            .app_data(tera.clone())
            .route("/about", web::get().to(about))
            .route("/items/{id}", web::get().to(item_page))
            .route("/api/items/{id}", web::get().to(item_api))
    })
    .bind(("127.0.0.1", 0))?;

    bench_harness::ready(server.addrs()[0].port());
    server.run().await
}
