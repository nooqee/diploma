package main

import (
	"context"
	"encoding/json"
	"os"
	"strconv"

	"github.com/chromedp/cdproto/cdp"
	"github.com/chromedp/chromedp"
	"github.com/sirupsen/logrus"
)

type Vacanсy struct {
	Link       string `json:"link"`
	Title      string `json:"title"`
	Expirience string `json:"expirience"`
	Company    string `json:"company"`
	City       string `json:"city"`
}

// css means css selector
type SiteSelectors struct {
	mainLink string
	List     string
	Block    string
	Link     string
	Title    string
	Exp      string
	Company  string
	City     string
}

// var hh SiteSelectors = SiteSelectors{
// 	mainLink: `https://kazan.hh.ru/search/vacancy?text=go&excluded_text=%D0%BF%D0%B8%D1%81%D1%8C%D0%BC%D0%B5%D0%BD%D0%BD%D0%BE%D0%B9%2C+%D0%BC%D0%B5%D0%BD%D0%B5%D0%B4%D0%B6%D0%B5%D1%80%2C+%D0%BE%D0%BF%D0%B5%D1%80%D0%B0%D1%82%D0%BE%D1%80%2C+%D0%BA%D1%83%D1%80%D1%8C%D0%B5%D1%80%2C+%D0%B1%D0%B0%D1%80%D0%B8%D1%81%D1%82%D0%B0%2C+%D0%BE%D1%84%D0%B8%D1%86%D0%B8%D0%B0%D0%BD%D1%82%2C+%D0%BA%D0%B0%D1%81%D1%81%D0%B8%D1%80%2C+%D1%8D%D0%BD%D0%B5%D1%80%D0%B4%D0%B6%D0%B0%D0%B9%D0%B7%D0%B5%D1%80%2C+%D0%B0%D1%80%D1%82-%D0%B4%D0%B8%D1%80%D0%B5%D0%BA%D1%82%D0%BE%D1%80%2C+%D1%87%D0%B0%D1%82%D0%B0%2C+%D1%87%D0%B0%D1%82%2C+%D0%B1%D1%83%D1%81%D1%82%D0%B5%D1%80%2C+%D0%B3%D0%BE%D0%BB%D0%BE%D1%81%D0%BE%D0%B2%D0%BE%D0%B9&salary=&salary=&salary_mode=&currency_code=RUR&experience=doesNotMatter&employment_form=FULL&work_format=REMOTE&work_format=HYBRID&order_by=relevance&search_period=0&items_on_page=100&L_save_area=true&page=`,
// 	List:     `[data-qa="vacancy-serp__results"]`,
// 	Block:    `[data-qa="vacancy-serp__vacancy"]`,
// 	Link:     `[data-qa="serp-item__title"]`,
// 	Title:    `[data-qa="serp-item__title-text"]`,
// 	Exp:      `[data-qa^="vacancy-serp__vacancy-work-experience"]`,
// 	Company:  `[data-qa="vacancy-serp__vacancy-employer-text"]`,
// 	City:     `[data-qa="vacancy-serp__vacancy-address"]`,
// }

var habr SiteSelectors = SiteSelectors{
	mainLink: `https://career.habr.com/vacancies?q=Go&type=all&page=`,
	List:     `[class="section-group section-group--gap-medium"]`,
	Block:    `[class="vacancy-card"]`,
	Link:     `[class="vacancy-card__title-link"]`,
	Title:    `[class="vacancy-card__title"]`,
	Exp:      `[class="basic-salary"]`,
	Company:  `[class="vacancy-card__company-title"]`,
	City:     `[class="inline-list"]`,
}

func parse(ss SiteSelectors) []Vacanсy {

	allocCtx, cancel := chromedp.NewExecAllocator(context.Background())
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	var allVacancies []Vacanсy

	for page := 0; page < 11; page++ {
		url := strconv.Itoa(page)
		fullURL := ss.mainLink + url
		logrus.Infof("--- started parsing page %d ---", page)
		logrus.Infof("URL: %s", fullURL)

		var nodes []*cdp.Node
		err := chromedp.Run(ctx,
			chromedp.Navigate(fullURL),
			chromedp.WaitVisible(ss.List, chromedp.BySearch),
			chromedp.Nodes(ss.Block, &nodes, chromedp.ByQueryAll),
		)
		if err != nil {
			logrus.Warnf("couldnt get vacancies on the page %d: %s. Maybe no pages left?", page, err)
			break
		}
		if len(nodes) == 0 {
			logrus.Warnf("on the page %d was no vacancies. ending job...", page)
			break
		}
		counter := 0

		// #TODO:
		// Вывести код ниже в отдельную функцию принимающую значения css селекторов
		for _, node := range nodes {
			var v Vacanсy
			err := chromedp.Run(ctx,
				chromedp.AttributeValue(ss.Link, "href", &v.Link, nil, chromedp.BySearch, chromedp.FromNode(node)),
				chromedp.Text(ss.Title, &v.Title, chromedp.BySearch, chromedp.FromNode(node)),
				chromedp.Text(ss.Exp, &v.Expirience, chromedp.BySearch, chromedp.FromNode(node)),
				chromedp.Text(ss.Company, &v.Company, chromedp.BySearch, chromedp.FromNode(node)),
				chromedp.Text(ss.City, &v.City, chromedp.BySearch, chromedp.FromNode(node)),
			)
			if err != nil {
				logrus.Printf("couldnt extract data from a vacancy: %v", err)
				continue
			}

			allVacancies = append(allVacancies, v)
			counter++
		}
		logrus.Printf("found %d vacancies. collecting data now...", len(nodes))

	}

	return allVacancies
}

const (
//hh

// habr
// habrML      = `https://career.habr.com/vacancies?q=go&remote=true&type=all`
// habrVB      = `[class^="section-group"]`
// habrVac     = `[class="section-box"]`
// habrVacLink = `[class="vacancy-card__icon-link""]`
// habrTitle   = `[class="vacancy-card__title-link"]`
// habrCompany = `[class="link-comp link-comp--appearance-dark"]`
)

func main() {

	allVacancies := parse(habr)
	// allVacancies = parse(hh)

	logrus.Println("data collection finished. serializing data now...")

	jsonData, err := json.MarshalIndent(allVacancies, "", " ")
	if err != nil {
		logrus.Fatalf("JSON serialization failed: %v", err)
	}
	err = os.WriteFile("vacancies.json", jsonData, 0644)
	if err != nil {
		logrus.Fatalf("failed to write file: %v", err)
	}
	logrus.Println("data successfully extracted to vacancies.json")
	//fmt.Println(openPage(`https://kazan.hh.ru/search/vacancy?text=go&excluded_text=%D0%BC%D0%B5%D0%BD%D0%B5%D0%B4%D0%B6%D0%B5%D1%80%2C+%D0%BE%D0%BF%D0%B5%D1%80%D0%B0%D1%82%D0%BE%D1%80%2C+%D0%BA%D1%83%D1%80%D1%8C%D0%B5%D1%80%2C+%D0%B1%D0%B0%D1%80%D0%B8%D1%81%D1%82%D0%B0%2C+%D0%BE%D1%84%D0%B8%D1%86%D0%B8%D0%B0%D0%BD%D1%82%2C+%D0%BA%D0%B0%D1%81%D1%81%D0%B8%D1%80%2C+%D1%8D%D0%BD%D0%B5%D1%80%D0%B4%D0%B6%D0%B0%D0%B9%D0%B7%D0%B5%D1%80%2C+%D0%B0%D1%80%D1%82-%D0%B4%D0%B8%D1%80%D0%B5%D0%BA%D1%82%D0%BE%D1%80&salary=&salary=&salary_mode=&currency_code=RUR&experience=doesNotMatter&employment_form=FULL&work_format=REMOTE&work_format=HYBRID&order_by=relevance&search_period=0&items_on_page=100&L_save_area=true&hhtmFrom=vacancy_search_filter`))
}
