package main

import (
	"net/http"
	"net/url"

	"github.com/labstack/echo/v5"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

type writer struct{ h http.Header }

func (w *writer) Header() http.Header         { return w.h }
func (w *writer) Write(b []byte) (int, error) { return len(b), nil }
func (w *writer) WriteHeader(int)             {}

var app = func() *echo.Echo {
	e := echo.New()
	add := func(method, pattern string) {
		route := method + " " + pattern
		e.Add(method, pattern, func(c *echo.Context) error {
			values := c.PathValues()
			params := make(map[string]string, len(values))
			for _, p := range values {
				params[p.Name] = p.Value
			}
			out = map[string]any{"route": route, "params": params}
			return nil
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

var router = app.Router()
var rw = &writer{h: http.Header{}}

// One context, reset before each lookup, as Echo's own pool does.
var ctx = app.NewContext(nil, rw)

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}, Header: http.Header{}}
}

func operation(value any) any {
	out = nil
	ctx.Reset(value.(*http.Request), rw)
	// Route returns the matched handler, or Echo's 404 or 405 handler, which
	// only returns an error value.
	_ = router.Route(ctx)(ctx)
	return out
}
