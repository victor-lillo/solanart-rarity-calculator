const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { discordError } = require('./discord.js')

puppeteer.use(StealthPlugin())



const scrapy = async (url) => {
    // export async function scrapy() {
    // puppeteer usage as normal
    const result = await puppeteer.launch({ headless: true }).then(async browser => {
        // console.log('Getting collection data...')
        console.log('Getting collection data...');
        const page = await browser.newPage()
        const response = await page.goto(url)
        // await page.screenshot({ path: 'testresult.png', fullPage: true })

        // Bloqueamos basura por rendimiento
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
                request.abort();
            } else {
                request.continue();
            }
        });

        const arrayRequests = []
        page.on('request', request => {
            // console.log('>>', request.method(), request.url()))

            if (request.url().includes('nft_for_sale?collection')) {
                arrayRequests.push(request.url())
            }
        })

        //Comprobamos si es una colección existente en Opensea
        // console.log('Response status: ', response.status())
        if (response.status() >= 400 && response.status() <= 600) {

            const fakeError = {
                name: 'Message',
                message: `Error ${response.status()} in \n${url}`,
            }

            await browser.close()

            await discordError('Scraping', fakeError)

            return { error: 'error' }
        }

        await page.waitForTimeout(1000)


        //Link imágenes
        const imgURLs = await page.evaluate(() => {
            const elements = document.getElementsByClassName('rounded-circle');

            const imgLinks = []
            for (const element of elements) {
                imgLinks.push(element.src)
            }
            //Array de dos img: [0]Img colección [2][3]Símbolo SOL 
            return imgLinks.filter(element => element != null)
        })
        // console.log(imgURLs[0]);

        //Nombre
        const name = await page.evaluate(() => {
            return document.getElementsByTagName('title')[0].text.split(' - ')[0]
        })
        // console.log(name);

        await browser.close()

        // console.log(`All done!`)

        const obj = {

            imgURL: imgURLs[0],
            collectionName: name,
            apiSlug: arrayRequests[0].slice(8).split('.')[0]
        }

        return obj
    })
    return result

}

scrapy('https://solanart.io/collections/solyetisog')

//Export como module
module.exports = scrapy

