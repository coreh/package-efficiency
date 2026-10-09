package main

import (
	"net/http"
	"strconv"

	"github.com/beego/beego/v2/server/web"
)

// The shop on Beego: its router (web.Router with controllers), its template
// engine (html/template, found in views/ and built by web.AddViewPath)
// and c.ServeJSON. Production run mode (conf/app.conf, as Beego documents). The harness
// runner (its main function) serves handler(), which is what web.Run does with
// net/http after the same setup.

type ItemController struct{ web.Controller }

func (c *ItemController) id() (int, bool) {
	id, err := strconv.Atoi(c.Ctx.Input.Param(":id"))
	if err != nil {
		c.Abort("404")
		return 0, false
	}
	return id, true
}

type PageController struct{ web.Controller }

func (c *PageController) Get() {
	c.TplName = "about.tpl"
}

type ItemPageController struct{ ItemController }

func (c *ItemPageController) Get() {
	if id, ok := c.id(); ok {
		item := newItem(id)
		c.Data["ID"] = item.ID
		c.Data["Name"] = item.Name
		c.Data["Price"] = item.Price()
		c.Data["InStock"] = item.InStock
		c.Data["DiscountPercent"] = item.DiscountPercent
		c.Data["Note"] = item.Note
		c.Data["Tags"] = item.Tags
		c.Data["Related"] = item.Related
		c.TplName = "item.tpl"
	}
}

type APIController struct{ ItemController }

func (c *APIController) Get() {
	if id, ok := c.id(); ok {
		c.Data["json"] = newItem(id)
		_ = c.ServeJSON()
	}
}

func handler() http.Handler {
	web.BConfig.Log.AccessLogs = false
	web.Router("/about", &PageController{})
	web.Router("/items/:id", &ItemPageController{})
	web.Router("/api/items/:id", &APIController{})
	if err := web.AddViewPath("views"); err != nil {
		panic(err)
	}
	return web.BeeApp.Handlers
}
