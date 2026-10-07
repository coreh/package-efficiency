package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// The shop on Gin: its router, its HTML rendering (html/template, loaded with
// LoadHTMLGlob and rendered with c.HTML) and c.JSON. Release mode, and what
// gin.Default() sets up apart from the request logger: the recovery
// middleware. The harness runner (its main function) serves handler(), which
// is what router.Run does with net/http.
func handler() http.Handler {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.LoadHTMLGlob("templates/*")

	router.GET("/about", func(c *gin.Context) {
		c.HTML(http.StatusOK, "about.html", nil)
	})
	router.GET("/items/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.HTML(http.StatusOK, "item.html", newItem(id))
	})
	router.GET("/api/items/:id", func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.JSON(http.StatusOK, newItem(id))
	})
	return router
}
