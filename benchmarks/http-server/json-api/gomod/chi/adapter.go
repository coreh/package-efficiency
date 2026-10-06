package main
import("encoding/json";"net/http";"strconv";"github.com/go-chi/chi/v5")
func handler() http.Handler {
 router:=chi.NewRouter()
 router.Get("/",func(w http.ResponseWriter,r *http.Request){w.Header().Set("Content-Type","text/plain");w.Write([]byte("Hello, World!"))})
 router.Get("/users/{id}",func(w http.ResponseWriter,r *http.Request){id,_:=strconv.Atoi(chi.URLParam(r,"id"));w.Header().Set("Content-Type","application/json");json.NewEncoder(w).Encode(map[string]any{"id":id,"name":"User "+strconv.Itoa(id)})})
 router.Post("/echo",func(w http.ResponseWriter,r *http.Request){var body any;if err:=json.NewDecoder(r.Body).Decode(&body);err!=nil {http.Error(w,"bad JSON",400);return};w.Header().Set("Content-Type","application/json");json.NewEncoder(w).Encode(map[string]any{"echo":body})})
 return router
}
