package main

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var out any

func handler(route string) httprouter.Handle {
	return func(_ http.ResponseWriter, _ *http.Request, ps httprouter.Params) {
		params := map[string]string{}
		for _, p := range ps {
			params[p.Key] = p.Value
		}
		out = map[string]any{"route": route, "params": params}
	}
}

var router = func() *httprouter.Router {
	r := httprouter.New()
	for _, n := range resources {
		r.Handle("GET", "/api/"+n, handler("GET /api/"+n))
		r.Handle("POST", "/api/"+n, handler("POST /api/"+n))
		r.Handle("GET", "/api/"+n+"/:id", handler("GET /api/"+n+"/:id"))
		r.Handle("PUT", "/api/"+n+"/:id", handler("PUT /api/"+n+"/:id"))
	}
	return r
}()

type request struct{ method, path string }

func prepare(value any) any {
	m := value.(map[string]any)
	return request{m["method"].(string), m["path"].(string)}
}

func operation(value any) any {
	req := value.(request)
	h, ps, _ := router.Lookup(req.method, req.path)
	if h == nil {
		return nil
	}
	out = nil
	h(nil, nil, ps)
	return out
}
