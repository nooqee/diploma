package sources

import (
	"strings"
	"testing"
)

func TestBuildSearchURL(t *testing.T) {
	tests := []struct {
		source   string
		query    string
		expected string
	}{
		{"hh", "golang", "https://kazan.hh.ru/search/vacancy?text=golang"},
		{"headhunter", "golang", "https://kazan.hh.ru/search/vacancy?text=golang"},
		{"habr", "python", "https://career.habr.com/vacancies?q=python&type=all"},
		{"habr-career", "backend developer", "https://career.habr.com/vacancies?q=backend+developer&type=all"},
		{"unknown", "test", ""},
	}

	for _, tt := range tests {
		got := BuildSearchURL(tt.source, tt.query)
		if got != tt.expected {
			t.Errorf("BuildSearchURL(%q, %q) = %q, want %q", tt.source, tt.query, got, tt.expected)
		}
	}
}

func TestExtractJobLinks_HH(t *testing.T) {
	html := `
<!DOCTYPE html>
<html>
<body>
<a href="/vacancy/12345">Вакансия 1</a>
<a href="/vacancy/67890">Вакансия 2</a>
<a href="/vacancy/12345">Дубликат</a>
<a href="/some/other/path">Не вакансия</a>
</body>
</html>`

	links := ExtractJobLinks("hh", html)
	if len(links) != 2 {
		t.Fatalf("expected 2 unique links, got %d: %v", len(links), links)
	}
	if !strings.Contains(links[0], "kazan.hh.ru") {
		t.Errorf("expected absolute hh.ru URL, got %q", links[0])
	}
}

func TestExtractJobLinks_Habr(t *testing.T) {
	html := `
<!DOCTYPE html>
<html>
<body>
<a href="/vacancies/100500">Вакансия A</a>
<a href="/vacancies/100501">Вакансия B</a>
<a href="/vacancies/programmist_python">Категория Python</a>
<a href="/vacancies/java_developer">Категория Java</a>
<a href="/vacancies/skills/golang">Скилл</a>
<a href="/vacancies/skills/python">Скилл 2</a>
<a href="/companies/1">Компания</a>
</body>
</html>`

	links := ExtractJobLinks("habr", html)
	if len(links) != 2 {
		t.Fatalf("expected 2 links, got %d: %v", len(links), links)
	}
	for _, l := range links {
		if strings.Contains(l, "/skills/") || strings.Contains(l, "programmist_") || strings.Contains(l, "_developer") {
			t.Errorf("should not contain skills/category links, got %q", l)
		}
	}
	if !strings.Contains(links[0], "career.habr.com") {
		t.Errorf("expected absolute habr URL, got %q", links[0])
	}
}
