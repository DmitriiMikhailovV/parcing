const puppeteer = require('puppeteer')
const fs = require('fs');

//search request
//amount of items
//#nejprodavanejsi
//#cenadesc
//#nejlepehodnocene
//https://www.alza.cz/search.htm?exps=iphone#cenadesc

const start = async () => {
    const link = 'https://www.alza.cz/search.htm?exps='
    const search = 'iphone'
    const searchQuery = encodeURIComponent(search)
    const searchRequest = `${link}${searchQuery}`

    const browser = await puppeteer.launch({headless: false, devtools: true})
    const page = await browser.newPage()
    await page.setViewport({width: 1920, height: 1020})
    // await page.screenshot({path: 'example.png'})
    await page.goto(searchRequest)
    await page.waitForSelector('a.goToTop')
    const html = await page.evaluate((searchQuery) => {
        const result = {searchRequest: searchQuery, amountOfItems: null, bestsellingList: [], mostExpensiveList : [], reviewsList: []}
        const numberOfItems = document.querySelector('span.numberItem').innerText
        result['amountOfItems'] = Number(numberOfItems)
        const items = document.querySelectorAll('div.box.browsingitem')
        items.forEach(item => {
            const productKey = item.querySelector('span.code').innerText
            const name = item.querySelector('a.name.browsinglink').innerText
            const image = item.querySelector('img.js-box-image').getAttribute('data-src')
            const cost = item.querySelector('span.c2').innerText.replace(/[^0-9]/g, '')
            const stock = item.querySelector('div.postfix').innerText.replace(/[a-zA-Z\s]/g,'')
            const rating = item.querySelector('div.star-rating-wrapper').getAttribute('data-rating').slice(2)+' %'
            result.bestsellingList = [...result.bestsellingList, {productKey, name, image, cost, stock, rating}]
        })
        console.log(result)
        return result
    }, searchQuery)
    // await browser.close()
    fs.writeFile(`alza-parsing-by-${search}.json`, JSON.stringify(html), (err)=> {
        if (err) throw err
        console.log(`Saved alza-parsing-by-${search}.json`)
    })
    
}

start()

