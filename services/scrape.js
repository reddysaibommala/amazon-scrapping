const puppeteer = require('puppeteer');

const url = 'https://www.amazon.in/s';
browser = null;

async function getDriver() {
  var browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  return browser
}

async function scrapeProductsData(url) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.goto(url,{waitUntil: 'load'});
  let products = await checkProducts(page);
  return products;
}

async function checkProducts(page) {
  await page.reload();
  await page.waitForSelector('#search > div.s-desktop-width-max.s-opposite-dir > div > div.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span:nth-child(4) > div.s-main-slot.s-result-list.s-search-results.sg-row')
  let products = await page.evaluate(() => {
    let elementArray = [];
    let dataArray = [];
    let docs =  document.querySelectorAll('#search > div.s-desktop-width-max.s-opposite-dir > div > div.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span:nth-child(4) > div.s-main-slot.s-result-list.s-search-results.sg-row > div')
    for(let divI = 1; divI<docs.length-4;divI++) {
      elementArray.push(docs[divI])
    }
    let promise = new Promise((resolve,reject) => {
      for(let text = 0; text < elementArray.length; text++) {
        dataArray.push({
          "asinId": elementArray[text].getAttribute('data-asin') ? elementArray[text].getAttribute('data-asin') : '',
          "productName": elementArray[text].querySelector('div > span > div > div > div  h2 > a > span') ? elementArray[text].querySelector('div > span > div > div > div  h2 > a > span').innerText : '',
          "productURL": elementArray[text].querySelector('div > span > div > div > div  h2 > a ') ? elementArray[text].querySelector('div > span > div > div > div  h2 > a ').href+'&tag=amdot-21&language=en_IN' : '',
          "productImg" : elementArray[text].querySelector('div > span > div > div  span > a > div > img ') ? elementArray[text].querySelector('div > span > div > div  span > a > div > img ').src : '',
          "price": elementArray[text].querySelector('div > span > div > div span.a-price-whole') ? elementArray[text].querySelector('div > span > div > div span.a-price-whole').innerText.trim().replace(/\,/,"") : '0',
          "strike": elementArray[text].querySelector('div > span > div > div span.a-price.a-text-price .a-offscreen') ? elementArray[text].querySelector('div > span > div > div span.a-price.a-text-price .a-offscreen').innerText.trim().replace(/\,/,"").substr(1,9) : '0',
          "rating": elementArray[text].querySelector('div > span > div > div a > i ') ? elementArray[text].querySelector('div > span > div > div a > i').innerText : '',
          "offer" :elementArray[text].querySelector('div.a-section div.a-section span') ? elementArray[text].querySelector('div.a-section div.a-section span').innerText : ''
        })
        resolve(dataArray)
      }
    })
    return promise;
  })
  return products;
}

async function scrapeProductData(url, asinId) {
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  await page.goto(url,{waitUntil: 'load'});
  let product = await checkProduct(page, asinId);
  return product;
}

async function checkProduct(page, asinId) {
    await page.reload();
    await page.waitForSelector('#prodDetails > div > div:nth-child(1) > div:nth-child(1) > div')
    let product = await page.evaluate((sel, asinId) => {
      let elementArray = [];
      let dataObj = {};
      dataObj[asinId] = {};
      let docs =  document.querySelectorAll('#productDetails_techSpec_section_1 > tbody > tr')
      for(let divI = 0; divI<docs.length;divI++){
        elementArray.push(docs[divI])
      }
      let promise = new Promise((resolve,reject) =>{
        for(let text = 0; text < elementArray.length; text++){
          let key = elementArray[text].querySelector('#productDetails_techSpec_section_1 > tbody > tr > th') ? elementArray[text].querySelector('#productDetails_techSpec_section_1 > tbody > tr > th').innerText : '';
          let val = elementArray[text].querySelector('#productDetails_techSpec_section_1 > tbody > tr > td') ? elementArray[text].querySelector('#productDetails_techSpec_section_1 > tbody > tr > td').innerText : '';
          dataObj[asinId][key] = val;
          
          resolve(dataObj)
        }
      })
      return promise;
    }, '#productDetails_techSpec_section_1', asinId)
    return product;
}

async function scrapeProducts(key) {
  let products = [];
  process.setMaxListeners(0);
  browser = await getDriver();
  for (let page = 1; page <= 2; page++) {
    const productsUrl = `${url}?k=${key}&page=${page}`;
    let data = await scrapeProductsData(productsUrl);
    products = products.concat(data);
  }
  browser.close();
  return products;
}

async function scrapeProduct(url, asinId) {
  process.setMaxListeners(0);
  browser = await getDriver();
  let productDetails = await scrapeProductData(url, asinId)
  browser.close();
  return productDetails;
}

async function scrape(key) {
  let products = [];
  process.setMaxListeners(0);
  browser = await getDriver();
  for (let page = 1; page <= 2; page++) {
    const productsUrl = `${url}?k=${key}&page=${page}`;
    let data = await scrapeProducts(productsUrl);
    products = products.concat(data);
  }
  console.log(products);
  const productJobs = [];
  for (let page = 0; page < products.length; page++) {
    if (products[page].productURL) {
      productJobs.push(scrapeProduct(products[page].productURL, products[page].asinId));
    }
  }
  return Promise.allSettled(productJobs)
  .then((productsInfo) => {
    browser.close();
    products = products.map(product => {
      if (product.asinId) {
        const index = productsInfo.findIndex(p => {
          return (p.status === 'fulfilled' && p.value && p.value[product.asinId])
        });
        if (index !== -1) product.technicalDetails = productsInfo[index].value[product.asinId];
      }
      return product;
    })
    return products;
  })
  .catch((err) => {
    browser.close();
    return err;
  });
}

module.exports = {
  scrapeProducts: scrapeProducts,
  scrapeProduct: scrapeProduct
}