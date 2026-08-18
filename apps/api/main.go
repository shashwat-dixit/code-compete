package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/shashwat-dixit/code-compete/internal/config"
)

func main() {
	addr := ":" + config.Getenv("API_PORT", "8080")
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", healthz)

	log.Printf("api listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func healthz(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "api",
	})
}
