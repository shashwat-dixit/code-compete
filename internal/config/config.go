// Package config will load process environment for API and workers.
// Keep it small: no secret defaults, no remote config.
package config

import "os"

func Getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
