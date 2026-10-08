package main

import (
	"net/http"
	"net/url"

	"github.com/gorilla/mux"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var router = func() *mux.Router {
	r := mux.NewRouter()
	add := func(method, pattern, name string) {
		r.HandleFunc(pattern, func(http.ResponseWriter, *http.Request) {}).Methods(method).Name(method + " " + name)
	}
	for _, n := range resources {
		add("GET", "/api/"+n, "/api/"+n)
		add("POST", "/api/"+n, "/api/"+n)
		add("GET", "/api/"+n+"/{id}", "/api/"+n+"/:id")
		add("PUT", "/api/"+n+"/{id}", "/api/"+n+"/:id")
	}
	return r
}()

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}}
}

func operation(value any) any {
	var match mux.RouteMatch
	if !router.Match(value.(*http.Request), &match) {
		return nil
	}
	return map[string]any{"route": match.Route.GetName(), "params": match.Vars}
}
