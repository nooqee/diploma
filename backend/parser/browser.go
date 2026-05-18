package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

// BrowserFetcher скачивает HTML через реальный браузер (Rod / Chromium).
type BrowserFetcher struct {
	browser *rod.Browser
}

// NewBrowserFetcher создаёт fetcher. Если CHROME_WS_URL задан — подключается к
// существующему Chrome (например, запущенному на хосте). Иначе Rod сам скачает
// и запустит Chromium внутри контейнера / на машине.
// При любой ошибке возвращает nil — парсер продолжит работать через HTTP.
func NewBrowserFetcher() *BrowserFetcher {
	wsURL := os.Getenv("CHROME_WS_URL")

	var browser *rod.Browser

	if wsURL != "" {
		log.Printf("browser: подключаемся к существующему Chrome по %s", wsURL)
		browser = rod.New().ControlURL(wsURL)
		if err := browser.Connect(); err != nil {
			log.Printf("browser: не удалось подключиться к Chrome: %v", err)
			return nil
		}
	} else {
		log.Println("browser: запускаем Chromium через Rod...")
		path, _ := launcher.LookPath()
		if path == "" {
			b := launcher.NewBrowser()
			var err error
			path, err = b.Get()
			if err != nil {
				log.Printf("browser: не удалось скачать Chromium: %v", err)
				return nil
			}
		}
		u, err := launcher.New().Bin(path).Launch()
		if err != nil {
			log.Printf("browser: не удалось запустить Chromium: %v", err)
			return nil
		}
		browser = rod.New().ControlURL(u)
		if err := browser.Connect(); err != nil {
			log.Printf("browser: не удалось подключиться к Chromium: %v", err)
			return nil
		}
	}

	return &BrowserFetcher{browser: browser}
}

// Fetch открывает url в браузере, ждёт загрузки и возвращает HTML.
func (bf *BrowserFetcher) Fetch(urlStr string) (string, error) {
	if bf == nil || bf.browser == nil {
		return "", fmt.Errorf("browser fetcher not initialized")
	}
	page, err := bf.browser.Page(proto.TargetCreateTarget{URL: urlStr})
	if err != nil {
		return "", fmt.Errorf("rod page: %w", err)
	}
	page.WaitLoad()
	time.Sleep(2 * time.Second)

	html, err := page.HTML()
	if err != nil {
		return "", fmt.Errorf("rod html: %w", err)
	}
	_ = page.Close()
	return html, nil
}

// Close закрывает браузер.
func (bf *BrowserFetcher) Close() error {
	if bf == nil || bf.browser == nil {
		return nil
	}
	return bf.browser.Close()
}
