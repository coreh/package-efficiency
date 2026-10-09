package main

import (
	"net/http"
	"os"
	"strconv"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo/render"
)

// The shop on Buffalo: its router (buffalo.App), its render engine (Plush
// templates read from templates/, rendered with r.HTML inside the
// application layout) and r.JSON. Production environment, the worker off (no
// background jobs here). The harness runner (its main function) serves
// handler(), and a *buffalo.App is an http.Handler, as app.Serve makes it.

var r = render.New(render.Options{
	HTMLLayout:  "application.plush.html",
	TemplatesFS: os.DirFS("templates"),
})

func handler() http.Handler {
	// Request logging is off, as in every server task. buffalo.RequestLogger
	// is the variable Buffalo documents for replacing its logging middleware.
	buffalo.RequestLogger = func(next buffalo.Handler) buffalo.Handler { return next }
	app := buffalo.New(buffalo.Options{Env: "production", WorkerOff: true})

	app.GET("/about", func(c buffalo.Context) error {
		c.Set("title", "About this shop")
		return c.Render(http.StatusOK, r.HTML("about.plush.html"))
	})
	app.GET("/items/{id}", func(c buffalo.Context) error {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.Error(http.StatusNotFound, err)
		}
		item := newItem(id)
		c.Set("title", item.Name)
		c.Set("item", item)
		return c.Render(http.StatusOK, r.HTML("item.plush.html"))
	})
	app.GET("/api/items/{id}", func(c buffalo.Context) error {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.Error(http.StatusNotFound, err)
		}
		return c.Render(http.StatusOK, r.JSON(newItem(id)))
	})
	return app
}
