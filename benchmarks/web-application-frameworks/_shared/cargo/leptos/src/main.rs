//! The sample application on Leptos: components rendered on the server by
//! leptos_axum, Leptos's own router for the pages, and (as Leptos's
//! documentation does for an endpoint with its own address) an axum route
//! beside them for the API. The layout follows the start-axum template.
use axum::extract::Path;
use axum::{Json, Router, routing::get};
use leptos::either::Either;
use leptos::prelude::*;
use leptos_axum::{LeptosRoutes, generate_route_list};
use leptos_meta::{MetaTags, Title, provide_meta_context};
use leptos_router::components::{Route, Router as PageRouter, Routes};
use leptos_router::hooks::use_params_map;
use leptos_router::{ParamSegment, StaticSegment};

mod catalog;
use catalog::{Item, item, price};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn shell(options: LeptosOptions) -> impl IntoView {
    view! {
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <HydrationScripts options/>
                <MetaTags/>
            </head>
            <body>
                <App/>
            </body>
        </html>
    }
}

#[component]
fn App() -> impl IntoView {
    provide_meta_context();
    view! {
        <PageRouter>
            <Routes fallback=|| "Page not found.">
                <Route path=StaticSegment("about") view=About/>
                <Route path=(StaticSegment("items"), ParamSegment("id")) view=ItemPage/>
            </Routes>
        </PageRouter>
    }
}

#[component]
fn About() -> impl IntoView {
    view! {
        <Title text="About this shop"/>
        <main id="bench">
            <h1>"About this shop"</h1>
            <p>"This page is the same for every visitor."</p>
            <ul class="facts">
                <li>"One static page"</li>
                <li>"One dynamic page"</li>
                <li>"One API route"</li>
            </ul>
        </main>
    }
}

#[component]
fn ItemPage() -> impl IntoView {
    let params = use_params_map();
    let id = params.read_untracked().get("id").and_then(|id| id.parse::<u64>().ok());
    let Some(id) = id else { return Either::Left(view! { <p>"No such item."</p> }) };
    let item = item(id);
    Either::Right(view! {
        <Title text=item.name.clone()/>
        <main id="bench" data-item=item.id>
            <h1>{item.name}</h1>
            <p class="price">{price(item.price_cents)}</p>
            {if item.in_stock {
                Either::Left(view! { <p class="stock">"In stock"</p> })
            } else {
                Either::Right(view! { <p class="stock out">"Sold out"</p> })
            }}
            {(item.discount_percent != 0).then(|| view! { <p class="discount">{format!("Save {}%", item.discount_percent)}</p> })}
            <p class="note">{item.note}</p>
            <ul class="tags">{item.tags.iter().map(|tag| view! { <li>{*tag}</li> }).collect_view()}</ul>
            <table class="related">
                <thead><tr><th>"Item"</th><th>"Price"</th></tr></thead>
                <tbody>
                    {item.related.into_iter().map(|related| view! {
                        <tr>
                            <td><a href=format!("/items/{}", related.id)>{related.name}</a></td>
                            <td>{price(related.price_cents)}</td>
                        </tr>
                    }).collect_view()}
                </tbody>
            </table>
            <footer hidden>"rendered"</footer>
        </main>
    })
}

async fn item_api(Path(id): Path<u64>) -> Json<Item> {
    Json(item(id))
}

#[tokio::main]
async fn main() {
    bench_harness::boot();
    // What cargo-leptos would pass in the environment, said here: the build is plain cargo.
    let options = LeptosOptions::builder().output_name("shop").build();
    let routes = generate_route_list(App);
    let app = Router::new()
        .route("/api/items/{id}", get(item_api))
        .leptos_routes(&options, routes, {
            let options = options.clone();
            move || shell(options.clone())
        })
        .with_state(options);

    // The port is the harness's to learn, so the listener is bound here and
    // not at the configured site address.
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    bench_harness::ready(listener.local_addr().unwrap().port());
    axum::serve(listener, app).await.unwrap();
}
