package config

import "testing"

func TestGetenvFallback(t *testing.T) {
	t.Setenv("CODE_COMPETE_TEST_EMPTY", "")
	if got := Getenv("CODE_COMPETE_TEST_EMPTY", "fallback"); got != "fallback" {
		t.Fatalf("got %q", got)
	}
}

func TestGetenvSet(t *testing.T) {
	t.Setenv("CODE_COMPETE_TEST_SET", "value")
	if got := Getenv("CODE_COMPETE_TEST_SET", "fallback"); got != "value" {
		t.Fatalf("got %q", got)
	}
}
