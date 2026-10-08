package main

import (
	"net/http"
	"net/url"

	"github.com/bmizerany/pat"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

type writer struct{ h http.Header }

func (w *writer) Header() http.Header         { return w.h }
func (w *writer) Write(b []byte) (int, error) { return len(b), nil }
func (w *writer) WriteHeader(int)             {}

var rw = &writer{h: http.Header{}}

var mux = func() *pat.PatternServeMux {
	m := pat.New()
	list := func(method, pattern string) {
		route := method + " " + pattern
		m.Add(method, pattern, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
			out = map[string]any{"route": route, "params": map[string]string{}}
		}))
	}
	item := func(method, pattern string) {
		route := method + " " + pattern
		m.Add(method, pattern, http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
			// pat hands parameters over as query values named ":id".
			out = map[string]any{"route": route, "params": map[string]string{"id": r.URL.Query().Get(":id")}}
		}))
	}
	for _, n := range resources {
		list("GET", "/api/"+n)
		list("POST", "/api/"+n)
		item("GET", "/api/"+n+"/:id")
		item("PUT", "/api/"+n+"/:id")
	}
	return m
}()

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}, Header: http.Header{}}
}

func operation(value any) any {
	req := value.(*http.Request)
	out = nil
	// pat prepends the parameters to the request's query string; the request
	// is reused here, so that is undone first.
	req.URL.RawQuery = ""
	mux.ServeHTTP(rw, req)
	return out
}
