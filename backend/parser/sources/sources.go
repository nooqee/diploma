package sources

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type ParseResult struct {
	Title string
	Text  string
	HTML  string
	Meta  map[string]interface{}
}

// BuildSearchURL формирует URL поисковой выдачи под источник и запрос пользователя.
func BuildSearchURL(source, query string) string {
	switch source {
	case "hh", "headhunter":
		return fmt.Sprintf("https://kazan.hh.ru/search/vacancy?text=%s", url.QueryEscape(query))
	case "habr", "habr-career":
		return fmt.Sprintf("https://career.habr.com/vacancies?q=%s&type=all", url.QueryEscape(query))
	default:
		return ""
	}
}

// ExtractJobLinks вытаскивает прямые ссылки на вакансии из HTML страницы поиска.
func ExtractJobLinks(source, htmlStr string) []string {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlStr))
	if err != nil {
		return nil
	}
	var rawCount int
	var links []string
	switch source {
	case "hh", "headhunter":
		doc.Find("a[href*='/vacancy/']").Each(func(i int, s *goquery.Selection) {
			rawCount++
			href, ok := s.Attr("href")
			if !ok {
				return
			}
			// Исключаем ссылки на поиск, авторизацию и т.п.
			if strings.Contains(href, "/search/") || strings.Contains(href, "/login") {
				return
			}
			if strings.HasPrefix(href, "/") {
				href = "https://kazan.hh.ru" + href
			}
			if !stringSliceContains(links, href) {
				links = append(links, href)
			}
		})
	case "habr", "habr-career":
		doc.Find("a[href*='/vacancies/']").Each(func(i int, s *goquery.Selection) {
			rawCount++
			href, ok := s.Attr("href")
			if !ok {
				return
			}
			// Пропускаем skills, search и категории (не-числовые ID)
			if strings.Contains(href, "/skills/") || strings.Contains(href, "/search") {
				return
			}
			// Habr: карточка = /vacancies/[число], категория = /vacancies/python_developer
			parts := strings.Split(strings.Trim(href, "/"), "/")
			if len(parts) >= 2 && parts[0] == "vacancies" {
				idPart := parts[1]
				isNum := true
				for _, r := range idPart {
					if r < '0' || r > '9' {
						isNum = false
						break
					}
				}
				if !isNum {
					return
				}
			}
			if strings.HasPrefix(href, "/") {
				href = "https://career.habr.com" + href
			}
			if !stringSliceContains(links, href) {
				links = append(links, href)
			}
		})
	}
	// Отладка: если сырых ссылок много, а результат пуст — проблема в фильтрах
	if rawCount > 0 && len(links) == 0 {
		// Возвращаем первые 5 сырых ссылок для анализа (только для отладки)
		var rawLinks []string
		doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
			if i >= 10 {
				return
			}
			href, _ := s.Attr("href")
			if href != "" {
				rawLinks = append(rawLinks, href)
			}
		})
		log.Printf("[sources] %s: raw matches=%d, filtered=0. Sample links: %v", source, rawCount, rawLinks)
	}
	return links
}

func stringSliceContains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func Parse(source string, html string, pageURL string) (*ParseResult, error) {
	switch source {
	case "hh", "headhunter":
		return parseHH(html, pageURL)
	case "habr", "habr-career":
		return parseHabr(html, pageURL)
	default:
		return parseGeneric(html, pageURL)
	}
}

func parseHH(htmlStr string, pageURL string) (*ParseResult, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlStr))
	if err != nil {
		return nil, err
	}
	// remove noisy tags
	doc.Find("script, style, noscript").Remove()

	title := strings.TrimSpace(doc.Find("h1").First().Text())
	// hh.ru main description often in div[data-qa="vacancy-description"]
	desc := strings.TrimSpace(doc.Find("div[data-qa=vacancy-description]").Text())
	if desc == "" {
		// fallback selectors
		desc = strings.TrimSpace(doc.Find(".vacancy-description").Text())
	}
	company := strings.TrimSpace(doc.Find("a[data-qa=vacancy-company-name]").First().Text())
	if company == "" {
		company = strings.TrimSpace(doc.Find(".vacancy-company-name").Text())
	}
	salary := strings.TrimSpace(doc.Find("span[data-qa=vacancy-salary]").First().Text())
	location := strings.TrimSpace(doc.Find("p[data-qa=vacancy-view-location]").First().Text())

	if title == "" && desc == "" {
		return nil, errors.New("hh parser: empty result")
	}
	meta := map[string]interface{}{"source_url": pageURL, "company": company, "salary": salary, "location": location}
	return &ParseResult{Title: title, Text: desc, HTML: htmlStr, Meta: meta}, nil
}

func parseHabr(htmlStr string, pageURL string) (*ParseResult, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlStr))
	if err != nil {
		return nil, err
	}
	doc.Find("script, style, noscript").Remove()
	title := strings.TrimSpace(doc.Find("h1").First().Text())
	// Habr Career uses article or div with class like 'jobposting' or 'post__body'
	desc := strings.TrimSpace(doc.Find(".jobposting, .post__body, .content").First().Text())
	if desc == "" {
		desc = strings.TrimSpace(doc.Find("article").Text())
	}
	company := strings.TrimSpace(doc.Find(".company, .company-name, .company__name").First().Text())
	salary := strings.TrimSpace(doc.Find(".salary, .job-salary").First().Text())
	location := strings.TrimSpace(doc.Find(".location, .job-location").First().Text())
	meta := map[string]interface{}{"source_url": pageURL, "company": company, "salary": salary, "location": location}
	return &ParseResult{Title: title, Text: desc, HTML: htmlStr, Meta: meta}, nil
}

func parseGeneric(htmlStr string, pageURL string) (*ParseResult, error) {
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlStr))
	if err != nil {
		return nil, err
	}
	doc.Find("script, style, noscript").Remove()
	title := strings.TrimSpace(doc.Find("title").First().Text())
	// join paragraphs for a cleaner text result
	var parts []string
	doc.Find("article p, p").Each(func(i int, s *goquery.Selection) {
		t := strings.TrimSpace(s.Text())
		if t != "" {
			parts = append(parts, t)
		}
	})
	body := strings.TrimSpace(strings.Join(parts, "\n\n"))
	if title == "" && body == "" {
		return nil, errors.New("generic parser: empty")
	}
	meta := map[string]interface{}{"source_url": pageURL}
	return &ParseResult{Title: title, Text: body, HTML: htmlStr, Meta: meta}, nil
}
