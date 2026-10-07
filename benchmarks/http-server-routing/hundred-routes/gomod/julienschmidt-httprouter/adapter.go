package main

import "github.com/julienschmidt/httprouter"

var resources = []string{"users", "orders", "products", "invoices", "carts", "sessions", "teams", "projects", "tickets", "comments", "posts", "tags", "files", "folders", "devices", "alerts", "reports", "payments", "coupons", "reviews", "regions", "warehouses", "shipments", "accounts", "webhooks"}

var router = func() *httprouter.Router {
	r := httprouter.New()
	for _, name := range resources {
		for _, m := range []string{"GET", "POST"} {
			r.Handle(m, "/api/"+name, func(http_ http_Request, _ httprouter.Params) {})
		}
	}
	return r
}()
