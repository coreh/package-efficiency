package main

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

type found struct{ method, pattern string }

// chi answers with its own pattern ("/api/users/{id}"). This only renames
// that answer to the task's label; it cannot answer a request path.
var labels = map[found]string{}

var mux = func() *chi.Mux {
	r := chi.NewRouter()
	add := func(method, pattern, name string) {
		r.MethodFunc(method, pattern, func(http.ResponseWriter, *http.Request) {})
		labels[found{method, pattern}] = method + " " + name
	}
	for _, n := range resources {
		add("GET", "/api/"+n, "/api/"+n)
		add("POST", "/api/"+n, "/api/"+n)
		add("GET", "/api/"+n+"/{id}", "/api/"+n+"/:id")
		add("PUT", "/api/"+n+"/{id}", "/api/"+n+"/:id")
	}
	return r
}()

// One routing context, reset before each lookup, as chi's own pool does.
var rctx = chi.NewRouteContext()

type request struct{ method, path string }

func prepare(value any) any {
	m := value.(map[string]any)
	return request{m["method"].(string), m["path"].(string)}
}

func operation(value any) any {
	req := value.(request)
	rctx.Reset()
	pattern := mux.Find(rctx, req.method, req.path)
	if pattern == "" {
		return nil
	}
	params := make(map[string]string, len(rctx.URLParams.Keys))
	for i, key := range rctx.URLParams.Keys {
		params[key] = rctx.URLParams.Values[i]
	}
	return map[string]any{"route": labels[found{req.method, pattern}], "params": params}
}
