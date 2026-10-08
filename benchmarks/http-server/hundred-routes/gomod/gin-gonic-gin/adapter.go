package main

import (
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

type writer struct{ h http.Header }

func (w *writer) Header() http.Header         { return w.h }
func (w *writer) Write(b []byte) (int, error) { return len(b), nil }
func (w *writer) WriteHeader(int)             {}

var engine = func() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	e := gin.New()
	add := func(method, pattern string) {
		e.Handle(method, pattern, func(c *gin.Context) {
			params := map[string]string{}
			for _, p := range c.Params {
				params[p.Key] = p.Value
			}
			out = map[string]any{"route": method + " " + c.FullPath(), "params": params}
		})
	}
	for _, n := range resources {
		add("GET", "/api/"+n)
		add("POST", "/api/"+n)
		add("GET", "/api/"+n+"/:id")
		add("PUT", "/api/"+n+"/:id")
	}
	return e
}()

var rw = &writer{h: http.Header{}}

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}, Header: http.Header{}}
}

func operation(value any) any {
	out = nil
	engine.ServeHTTP(rw, value.(*http.Request))
	return out
}
