package main

import (
	"encoding/json"
	"html/template"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// The shop on chi. chi is a router for net/http and nothing else: the pages
// are html/template and the JSON is encoding/json, as its own examples do.
// The harness runner (its main function) serves handler().
func handler() http.Handler {
	templates := template.Must(template.ParseGlob("templates/*.html"))
	page := func(w http.ResponseWriter, name string, data any) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := templates.ExecuteTemplate(w, name, data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}

	router := chi.NewRouter()
	router.Get("/about", func(w http.ResponseWriter, r *http.Request) {
		page(w, "about.html", nil)
	})
	router.Get("/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		page(w, "item.html", newItem(id))
	})
	router.Get("/api/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(newItem(id))
	})
	return router
}
