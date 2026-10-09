//! The sample application on Loco, laid out as its "lightweight service"
//! starter (no database): an `App` implementing `Hooks`, routes added to
//! `AppRoutes`, Tera views through a view-engine initializer, `format::json`
//! and `format::render().view`. It is started with `boot::start` on the
//! production configuration in config/production.yaml.
use std::net::SocketAddr;

use async_trait::async_trait;
use axum::{Extension, Router as AxumRouter};
use loco_rs::{
    app::{AppContext, Hooks, Initializer},
    bgworker::Queue,
    boot::{self, BootResult, ServeParams, StartMode, create_app},
    config::Config,
    controller::{
        AppRoutes,
        views::{ViewEngine, engines::TeraView},
    },
    environment::Environment,
    prelude::*,
    task::Tasks,
};
use serde::Serialize;

mod catalog;
use catalog::{Item, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

#[derive(Serialize)]
struct RelatedView {
    id: u64,
    name: String,
    price: String,
}

#[derive(Serialize)]
struct ItemPage {
    item: Item,
    price: String,
    related: Vec<RelatedView>,
}

async fn about(ViewEngine(v): ViewEngine<TeraView>) -> Result<Response> {
    format::render().view(&v, "about.html", data!({}))
}

async fn item_page(ViewEngine(v): ViewEngine<TeraView>, Path(id): Path<u64>) -> Result<Response> {
    let item = item(id);
    let related = item.related.iter().map(|r| RelatedView { id: r.id, name: r.name.clone(), price: price(r.price_cents) }).collect();
    format::render().view(&v, "item.html", ItemPage { price: price(item.price_cents), related, item })
}

async fn item_api(Path(id): Path<u64>) -> Result<Response> {
    format::json(item(id))
}

pub struct ViewEngineInitializer;

#[async_trait]
impl Initializer for ViewEngineInitializer {
    fn name(&self) -> String {
        "view-engine".to_string()
    }

    async fn after_routes(&self, router: AxumRouter, _ctx: &AppContext) -> Result<AxumRouter> {
        Ok(router.layer(Extension(ViewEngine::from(TeraView::build()?))))
    }
}

pub struct App;

#[async_trait]
impl Hooks for App {
    fn app_name() -> &'static str {
        env!("CARGO_CRATE_NAME")
    }

    async fn boot(mode: StartMode, environment: &Environment, config: Config) -> Result<BootResult> {
        create_app::<Self>(mode, environment, config).await
    }

    // The default serve, with the port reported to the harness once the
    // listener is bound.
    async fn serve(app: AxumRouter, _ctx: &AppContext, serve_params: &ServeParams) -> Result<()> {
        let listener = tokio::net::TcpListener::bind(&format!("{}:{}", serve_params.binding, serve_params.port)).await?;
        bench_harness::ready(listener.local_addr()?.port());
        axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>()).await?;
        Ok(())
    }

    async fn initializers(_ctx: &AppContext) -> Result<Vec<Box<dyn Initializer>>> {
        Ok(vec![Box::new(ViewEngineInitializer)])
    }

    fn routes(_ctx: &AppContext) -> AppRoutes {
        AppRoutes::with_default_routes()
            .add_route(Routes::new().add("/about", get(about)).add("/items/{id}", get(item_page)).add("/api/items/{id}", get(item_api)))
    }

    async fn connect_workers(_ctx: &AppContext, _queue: &Queue) -> Result<()> {
        Ok(())
    }

    fn register_tasks(_tasks: &mut Tasks) {}
}

#[tokio::main]
async fn main() -> Result<()> {
    bench_harness::boot();
    let environment = Environment::Production;
    let config = App::load_config(&environment).await?;
    let boot = App::boot(StartMode::ServerOnly, &environment, config).await?;
    boot::start::<App>(boot, ServeParams { port: 0, binding: "127.0.0.1".to_string() }, true).await
}
