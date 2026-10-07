package main

import (
	"html/template"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

// The shop on Echo: its router, its renderer (echo.TemplateRenderer over
// html/template, rendered with c.Render) and c.JSON. The middleware is that
// of Echo's own example apart from the request logger: Recover. The harness
// runner (its main function) serves handler() with net/http's server, which
// Echo documents beside e.Start.
func handler() http.Handler {
	e := echo.New()
	e.Use(middleware.Recover())
	e.Renderer = &echo.TemplateRenderer{Template: template.Must(template.ParseGlob("templates/*.html"))}

	e.GET("/about", func(c *echo.Context) error {
		return c.Render(http.StatusOK, "about.html", nil)
	})
	e.GET("/items/:id", func(c *echo.Context) error {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return echo.ErrNotFound
		}
		return c.Render(http.StatusOK, "item.html", newItem(id))
	})
	e.GET("/api/items/:id", func(c *echo.Context) error {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return echo.ErrNotFound
		}
		return c.JSON(http.StatusOK, newItem(id))
	})
	return e
}
