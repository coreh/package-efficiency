package main

import (
	"net/http"
	"strconv"

	contractsfoundation "github.com/goravel/framework/contracts/foundation"
	contractshttp "github.com/goravel/framework/contracts/http"
	"github.com/goravel/framework/contracts/route"
	"github.com/goravel/framework/facades"
	"github.com/goravel/framework/foundation"
	frmhttp "github.com/goravel/framework/http"
	"github.com/goravel/framework/log"
	frameworkroute "github.com/goravel/framework/route"
	"github.com/goravel/framework/validation"
	"github.com/goravel/framework/view"
	"github.com/goravel/gin"
	ginfacades "github.com/goravel/gin/facades"
)

// The shop on Goravel, set up the way a Goravel application's bootstrap/app.go
// does it: foundation.Setup() with its providers (log, validation, view, route
// and the Gin HTTP driver), its configuration (http.default is "gin") and its
// routes. Routes answer with ctx.Response().View().Make (Go html/template
// files in resources/views, loaded by the Gin driver) and ctx.Response().Json.
// The harness runner (its main function) serves the route facade, which is an
// http.Handler, in the place of facades.Route().Run().

func providers() []contractsfoundation.ServiceProvider {
	return []contractsfoundation.ServiceProvider{
		&log.ServiceProvider{},
		&frmhttp.ServiceProvider{},
		&validation.ServiceProvider{},
		&view.ServiceProvider{},
		&frameworkroute.ServiceProvider{},
		&gin.ServiceProvider{},
	}
}

func config() {
	cfg := facades.Config()
	cfg.Add("app", map[string]any{"name": "shop", "env": "production", "debug": false, "timezone": "UTC", "locale": "en", "fallback_locale": "en"})
	cfg.Add("logging", map[string]any{
		"default": "stack",
		"channels": map[string]any{
			"stack":  map[string]any{"driver": "stack", "channels": []string{"single"}},
			"single": map[string]any{"driver": "single", "path": "/dev/null", "level": "error"},
		},
	})
	cfg.Add("http", map[string]any{
		"default": "gin",
		"drivers": map[string]any{
			"gin": map[string]any{
				"body_limit":   4096,
				"header_limit": 4096,
				"route": func() (route.Route, error) {
					return ginfacades.Route("gin"), nil
				},
			},
		},
	})
}

func routes() {
	r := facades.Route()
	r.Get("/about", func(ctx contractshttp.Context) contractshttp.Response {
		return ctx.Response().View().Make("about.tmpl")
	})
	r.Get("/items/{id}", func(ctx contractshttp.Context) contractshttp.Response {
		id, err := strconv.Atoi(ctx.Request().Route("id"))
		if err != nil {
			return ctx.Response().Status(http.StatusNotFound).String("not found")
		}
		item := newItem(id)
		return ctx.Response().View().Make("item.tmpl", map[string]any{
			"ID": item.ID, "Name": item.Name, "Price": item.Price(), "InStock": item.InStock,
			"DiscountPercent": item.DiscountPercent, "Note": item.Note, "Tags": item.Tags, "Related": item.Related,
		})
	})
	r.Get("/api/items/{id}", func(ctx contractshttp.Context) contractshttp.Response {
		id, err := strconv.Atoi(ctx.Request().Route("id"))
		if err != nil {
			return ctx.Response().Status(http.StatusNotFound).String("not found")
		}
		return ctx.Response().Json(http.StatusOK, newItem(id))
	})
}

func handler() http.Handler {
	foundation.Setup().
		WithProviders(providers).
		WithConfig(config).
		WithRouting(routes).
		Create()
	return facades.Route()
}
