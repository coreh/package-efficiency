//! The sample application on Cot: a `Project` with one `App` whose router
//! holds the three routes, Askama templates through `cot::Template`, and the
//! `Json` response. It is started the way `cot::run_at` documents, on a
//! listener of our own so that the port can be reported.
use cot::config::ProjectConfig;
use cot::html::Html;
use cot::json::Json;
use cot::static_files::StaticFilesMiddleware;
use cot::project::{MiddlewareContext, RegisterAppsContext, RootHandler, RootHandlerBuilder};
use cot::request::extractors::Path;
use cot::router::{Route, Router};
use cot::{App, AppBuilder, Bootstrapper, Project, Template};

mod catalog;
use catalog::{Item, Related, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Debug, Template)]
#[template(path = "about.html")]
struct AboutTemplate;

struct RelatedView {
    id: u64,
    name: String,
    price: String,
}

#[derive(Template)]
#[template(path = "item.html")]
struct ItemTemplate {
    item: Item,
    price: String,
    related: Vec<RelatedView>,
}

async fn about() -> cot::Result<Html> {
    Ok(Html::new(AboutTemplate.render()?))
}

async fn item_page(Path(id): Path<u64>) -> cot::Result<Html> {
    let item = item(id);
    let related = item.related.iter().map(|Related { id, name, price_cents }| RelatedView { id: *id, name: name.clone(), price: price(*price_cents) }).collect();
    let template = ItemTemplate { price: price(item.price_cents), related, item };
    Ok(Html::new(template.render()?))
}

async fn item_api(Path(id): Path<u64>) -> Json<Item> {
    Json(item(id))
}

struct ShopApp;

impl App for ShopApp {
    fn name(&self) -> &str {
        "shop"
    }

    fn router(&self) -> Router {
        Router::with_urls([
            Route::with_handler_and_name("/about", about, "about"),
            Route::with_handler_and_name("/items/{id}", item_page, "item"),
            Route::with_handler_and_name("/api/items/{id}", item_api, "item_api"),
        ])
    }
}

struct ShopProject;

impl Project for ShopProject {
    fn register_apps(&self, apps: &mut AppBuilder, _context: &RegisterAppsContext) {
        apps.register_with_views(ShopApp, "");
    }

    fn middlewares(&self, handler: RootHandlerBuilder, context: &MiddlewareContext) -> RootHandler {
        handler.middleware(StaticFilesMiddleware::from_context(context)).build()
    }
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    let bootstrapper = Bootstrapper::new(ShopProject).with_config(ProjectConfig::default()).boot().await.unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    cot::run_at(bootstrapper, listener).await.unwrap();
}
