package main

import (
	"encoding/json"
	"html/template"
	"net/http"
	"strconv"
)

// The shop on the standard library alone: net/http's ServeMux, html/template
// and encoding/json. The harness runner (its main function) serves handler().
func handler() http.Handler {
	templates := template.Must(template.ParseGlob("templates/*.html"))
	page := func(w http.ResponseWriter, name string, data any) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := templates.ExecuteTemplate(w, name, data); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /about", func(w http.ResponseWriter, r *http.Request) {
		page(w, "about.html", nil)
	})
	mux.HandleFunc("GET /items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		page(w, "item.html", newItem(id))
	})
	mux.HandleFunc("GET /api/items/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(r.PathValue("id"))
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(newItem(id))
	})
	return mux
}
