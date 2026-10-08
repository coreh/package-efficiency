package main

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/valyala/fasthttp"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

var handler = func() fasthttp.RequestHandler {
	app := fiber.New()
	add := func(method, pattern string) {
		route := method + " " + pattern
		app.Add([]string{method}, pattern, func(c fiber.Ctx) error {
			names := c.Route().Params
			params := make(map[string]string, len(names))
			for _, name := range names {
				// Fiber's values point into the request buffer; a value that
				// outlives the handler has to be copied.
				params[name] = strings.Clone(c.Params(name))
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
	return app.Handler()
}()

// Not timed: one fasthttp request context per fixture, with no connection.
func prepare(value any) any {
	m := value.(map[string]any)
	ctx := &fasthttp.RequestCtx{}
	ctx.Request.Header.SetMethod(m["method"].(string))
	ctx.Request.SetRequestURI(m["path"].(string))
	return ctx
}

func operation(value any) any {
	ctx := value.(*fasthttp.RequestCtx)
	out = nil
	ctx.Response.Reset()
	handler(ctx)
	return out
}
