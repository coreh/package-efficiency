package main

import (
	"net"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/template/html/v3"
)

// The shop on Fiber: its router, its view engine (Fiber's html engine, which
// is html/template, rendered with c.Render) and c.JSON. Fiber has a server of
// its own (fasthttp), so the harness runner hands it the listener through
// serve() instead of serving a net/http handler; see ../../_go/go-app.mjs.
func serve(listener net.Listener) error {
	app := fiber.New(fiber.Config{Views: html.New("./templates", ".html")})

	app.Get("/about", func(c fiber.Ctx) error {
		return c.Render("about", nil)
	})
	app.Get("/items/:id", func(c fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return fiber.ErrNotFound
		}
		return c.Render("item", newItem(id))
	})
	app.Get("/api/items/:id", func(c fiber.Ctx) error {
		id, err := strconv.Atoi(c.Params("id"))
		if err != nil {
			return fiber.ErrNotFound
		}
		return c.JSON(newItem(id))
	})
	return app.Listener(listener)
}
