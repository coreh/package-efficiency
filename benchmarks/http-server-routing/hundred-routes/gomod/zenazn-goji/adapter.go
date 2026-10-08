package main

import (
	"net/http"
	"net/url"

	"github.com/zenazn/goji/web"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

type writer struct{ h http.Header }

func (w *writer) Header() http.Header         { return w.h }
func (w *writer) Write(b []byte) (int, error) { return len(b), nil }
func (w *writer) WriteHeader(int)             {}

var rw = &writer{h: http.Header{}}

var mux = func() *web.Mux {
	m := web.New()
	for _, n := range resources {
		m.Get("/api/"+n, handler("GET /api/"+n))
		m.Post("/api/"+n, handler("POST /api/"+n))
		m.Get("/api/"+n+"/:id", handler("GET /api/"+n+"/:id"))
		m.Put("/api/"+n+"/:id", handler("PUT /api/"+n+"/:id"))
	}
	return m
}()

func handler(route string) func(web.C, http.ResponseWriter, *http.Request) {
	return func(c web.C, _ http.ResponseWriter, _ *http.Request) {
		params := c.URLParams
		if params == nil {
			params = map[string]string{}
		}
		out = map[string]any{"route": route, "params": params}
	}
}

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}, Header: http.Header{}}
}

func operation(value any) any {
	out = nil
	mux.ServeHTTP(rw, value.(*http.Request))
	return out
}
