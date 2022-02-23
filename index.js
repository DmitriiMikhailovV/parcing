const puppeteer = require('puppeteer')
const fs = require('fs')

//search request
//amount of items
//#nejprodavanejsi
// /nejprodavanejsi-nejlepsi-hdmi-kabely/18849600.htm
//#cenadesc
// /luxusni-nejdrazsi-hdmi-kabely/18849600.htm
//#nejlepehodnocene
// /hdmi-kabely-recenze/18849600.htm
//https://www.alza.cz/search.htm?exps=iphone#cenadesc

// https://www.alza.cz/iphone/18851638.htm

//     console.log(document.querySelector("a[href$='#nejprodavanejsi']"))
//     console.log(document.querySelector("a[href$='#cenadesc']"))
//     console.log(document.querySelector("a[href$='#nejlepehodnocene']"))
//   const resultedUrl = await page.url().slice(20)
//   const bestselling = `${link}${searchParams.bestselling}/${resultedUrl}`
//   const mostExpensive = `${link}${searchParams.mostExpensive}/${resultedUrl}`
//   const reviews = `${link}/${searchQuery}${searchParams.reviews}${resultedUrl}`
//   await browser.close()
const link = 'https://www.alza.cz'
const search = '/search.htm?exps='
const query = 'iphone'
const searchQuery = encodeURIComponent(query)
const searchRequest = `${link}${search}${searchQuery}`

const result = {
  searchRequest: query,
  amountOfItems: null,
  bestsellingList: [],
  mostExpensiveList: [],
  reviewsList: [],
}

const start = async (query, searchRequest, result) => {
  const browser = await puppeteer.launch({ headless: false, devtools: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1020 })
  await page.screenshot({ path: 'example.png' })
  await page.goto(searchRequest)
  await page.waitForSelector("a[href$='#cenadesc']")
  await page.$eval("a[href$='#cenadesc']", (elem) => elem.click())

  const html = await page.evaluate((result) => {
    const numberOfItems = document.querySelector('span.numberItem').innerText
    result['amountOfItems'] = Number(numberOfItems)
    const items = document.querySelectorAll('div.box.browsingitem')
    items.forEach((item) => {
      const productKey = item.querySelector('span.code').innerText
      const name = item.querySelector('a.name.browsinglink').innerText
      const image = item
        .querySelector('img.js-box-image')
        .getAttribute('data-src')
      const cost = item
        .querySelector('span.c2')
        .innerText.replace(/[^0-9]/g, '')
      const stock = item
        .querySelector('div.postfix')
        .innerText.replace(/[a-zA-Z\s]/g, '')
      const rating =
        item
          .querySelector('div.star-rating-wrapper')
          .getAttribute('data-rating')
          .slice(2) + ' %'
      result.mostExpensiveList = [
        ...result.mostExpensiveList,
        { productKey, name, image, cost, stock, rating },
      ]
    })
    console.log(result)
    return result
  }, result)

  // await browser.close()
  fs.writeFile(`alza-parsing-by-${query}.json`, JSON.stringify(html), (err) => {
    if (err) throw err
    console.log(`Saved alza-parsing-by-${query}.json`)
  })
}

start(query, searchRequest, result)
