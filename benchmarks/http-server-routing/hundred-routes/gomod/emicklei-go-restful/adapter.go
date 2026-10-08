package main

import (
	"net/http"
	"net/url"

	restful "github.com/emicklei/go-restful/v3"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

type writer struct{ h http.Header }

func (w *writer) Header() http.Header         { return w.h }
func (w *writer) Write(b []byte) (int, error) { return len(b), nil }
func (w *writer) WriteHeader(int)             {}

var rw = &writer{h: http.Header{}}

var container = func() *restful.Container {
	ws := new(restful.WebService)
	ws.Path("/api")
	add := func(builder *restful.RouteBuilder, name string) {
		ws.Route(builder.To(func(req *restful.Request, _ *restful.Response) {
			out = map[string]any{"route": name, "params": req.PathParameters()}
		}))
	}
	for _, n := range resources {
		add(ws.GET("/"+n), "GET /api/"+n)
		add(ws.POST("/"+n), "POST /api/"+n)
		add(ws.GET("/"+n+"/{id}"), "GET /api/"+n+"/:id")
		add(ws.PUT("/"+n+"/{id}"), "PUT /api/"+n+"/:id")
	}
	c := restful.NewContainer()
	c.Add(ws)
	return c
}()

func prepare(value any) any {
	m := value.(map[string]any)
	return &http.Request{Method: m["method"].(string), URL: &url.URL{Path: m["path"].(string)}, Header: http.Header{}}
}

func operation(value any) any {
	out = nil
	container.ServeHTTP(rw, value.(*http.Request))
	return out
}
