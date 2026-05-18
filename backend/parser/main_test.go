package main

import "testing"

func TestIsSearchPage(t *testing.T) {
	tests := []struct {
		url      string
		expected bool
	}{
		{"https://kazan.hh.ru/search/vacancy?text=golang", true},
		{"https://kazan.hh.ru/vacancy/12345?query=golang&hhtmFrom=search", false},
		{"https://career.habr.com/vacancies?q=python&type=all", true},
		{"https://career.habr.com/vacancies/100500", false},
		{"https://career.habr.com/vacancies/programmist_python", true},
		{"https://example.com/", false},
	}

	for _, tt := range tests {
		got := isSearchPage(tt.url)
		if got != tt.expected {
			t.Errorf("isSearchPage(%q) = %v, want %v", tt.url, got, tt.expected)
		}
	}
}
