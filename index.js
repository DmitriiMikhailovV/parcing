const puppeteer = require('puppeteer')
const fs = require('fs')

const link = 'https://www.alza.cz'
const search = '/search.htm?exps='
const query = 'iphone'
const searchQuery = encodeURIComponent(query)
const searchRequest = `${link}${search}${searchQuery}`

const requests = [
  {
    selector: "a[href$='#nejprodavanejsi']",
    resultOf: 'bestsellingList',
  },
  {
    selector: "a[href$='#cenadesc']",
    resultOf: 'mostExpensiveList',
  },
  {
    selector: "a[href$='#nejlepehodnocene']",
    resultOf: 'reviewsList',
  },
]

const result = {}

const parsing = async (
  query,
  searchRequest,
  result,
  { selector, resultOf }
) => {
  const browser = await puppeteer.launch({ headless: true, devtools: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1020 })
  await page.goto(searchRequest)
  await page.waitForSelector(selector)
  await page.$eval(selector, (elem) => elem.click())
  const currentPage = page.url()
  await page.goto(currentPage)
  result.searchRequest = query
  const html = await page.evaluate(
    (result, resultOf) => {
      const numberOfItems = document.querySelector('span.numberItem').innerText
      result['amountOfItems'] = Number(numberOfItems)
      const items = document.querySelectorAll('div.browsingitem')
      let arr = []
      items.forEach((item) => {
        const productKey = item.querySelector('span.code').innerText
        const name = item.querySelector('a.name.browsinglink').innerText
        const image = item
          .querySelector('img.js-box-image')
          .getAttribute('data-src')
        const cost = item
          .querySelector('span.c2')
          .innerText.replace(/[^0-9]/g, '')

        const stock = item.querySelector('div.postfix')
          ? item
              .querySelector('div.postfix')
              .innerText.replace(/[a-zA-Z\s]/g, '')
          : 'no data'
        const rating = item.querySelector('div.star-rating-wrapper')
          ? item
              .querySelector('div.star-rating-wrapper')
              .getAttribute('data-rating')
              .slice(2) + ' %'
          : 'no data'
        arr = [...arr, { productKey, name, image, cost, stock, rating }]
      })
      result[resultOf] = arr
      return result
    },
    result,
    resultOf
  )

  fs.writeFile(
    `alza-parsing-by-${query}-${resultOf}.json`,
    JSON.stringify(html),
    (err) => {
      if (err) throw err
      console.log(`Saved alza-parsing-by-${query}-${resultOf}.json`)
    }
  )
}

parsing(query, searchRequest, result, requests[0])
parsing(query, searchRequest, result, requests[1])
parsing(query, searchRequest, result, requests[2])
