package main
import("encoding/json";"net/http";"strconv")
func handler() http.Handler {
 router:=http.NewServeMux()
 router.HandleFunc("GET /",func(w http.ResponseWriter,r *http.Request){w.Header().Set("Content-Type","text/plain");w.Write([]byte("Hello, World!"))})
 router.HandleFunc("GET /users/{id}",func(w http.ResponseWriter,r *http.Request){id,_:=strconv.Atoi(r.PathValue("id"));w.Header().Set("Content-Type","application/json");json.NewEncoder(w).Encode(map[string]any{"id":id,"name":"User "+strconv.Itoa(id)})})
 router.HandleFunc("POST /echo",func(w http.ResponseWriter,r *http.Request){var body any;if err:=json.NewDecoder(r.Body).Decode(&body);err!=nil {http.Error(w,"bad JSON",400);return};w.Header().Set("Content-Type","application/json");json.NewEncoder(w).Encode(map[string]any{"echo":body})})
 return router
}
