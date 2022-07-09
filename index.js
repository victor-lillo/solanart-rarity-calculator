const fs = require('fs');
const path = require('path');
const chalk = require('chalk')
const { performance } = require('perf_hooks');


const rarityJSON = require('./src/rarity-json');
const { createDirs, msToMinAndSecs, sleep, getCollectionTotalNumber, arrayFilter, arrayCutter, numberWithPoints } = require('./src/various');
const { API_request } = require('./src/api-request');
const { processData } = require('./src/process-data');
const { collection_auto_fetcher, cicle_delay, auto_query_api_slug, excluded_collections } = require('./devSettings.json');
const { starting_collection } = require('./devSettings.json');
const { discordSummary, discordError } = require('./src/discord');


// const filtradoBlackList = various.filtroBlackList(filters.blackList, arrayActual[0])

const manual_collectionSlug = [
    // 'solanabananas',
    // 'eternalbeings',
    // 'solyetisog',
    // 'degenape',
    // 'infinitylabs',
    // 'aurory',
    'solpunks'
]

const apiSlug = 'qzlsklfacc'


const counter = {
    total_items: 0,
    added_items: 0,
    collections_bad_traits: [],
    collections_null_traits: [],
    collections_broken: [],
}


const resolve = async () => {

    //Marcador 0 de performance
    const t0 = performance.now();
    // Creamos carpeta results y subcarpetas si no existen
    createDirs()

    const collectionsToGet_unfiltered = []

    //Collections fetched de la pseudo API
    if (collection_auto_fetcher) {
        const query_volume_all = await API_request('https://qzlsklfacc.medianetwork.cloud/query_volume_all')

        //Almacena el collectionSlug
        for (const el of query_volume_all) {
            collectionsToGet_unfiltered.push(el.collection)
        }
        // console.log(`Fetched collections: ${collectionsToGet_unfiltered.length}`);
    }

    //Collections añadidas manualmente
    else {
        manual_collectionSlug.map(el => collectionsToGet_unfiltered.push(el))
        // console.log(`Colecciones manuales añadidas: ${collectionsToGet_unfiltered.length}`);
    }


    //Por si queremos iniciar a sacar colecciones a partir de una posición concreta
    arrayCutter(collectionsToGet_unfiltered, starting_collection.toLocaleLowerCase())

    console.log(chalk`{bold.hex('#24BBE4') \nORIGINAL COLLECTIONS TO ANALIZE: ${collectionsToGet_unfiltered.length}\n}`);


    const collectionsToGet = arrayFilter(excluded_collections, collectionsToGet_unfiltered)
    const filteredCollections_number = collectionsToGet_unfiltered.length - collectionsToGet.length
    // console.log(collectionsToGet);

    console.log(chalk`{bold.hex('#24BBE4') FILTERED COLLECTIONS TO ANALIZE: ${collectionsToGet.length}\n}`);


    //Testing collectionsToGet fetch 
    // if (collectionsToGet.length > 10) return

    //Recorremos nuestro array de slugs
    for (collectionSlug of collectionsToGet) {

        console.log(chalk`{bold.hex('#b75ee4') ► COLLECTION NUMBER ${collectionsToGet.indexOf(collectionSlug) + 1}/${collectionsToGet.length}}`);

        //Número total NFTs colección
        const api_url_number = 'https://' + apiSlug + '.medianetwork.cloud/get_collections'
        const assetsGetCollections = await API_request(api_url_number)
        await sleep(300)

        const { collectionLength, collectionFormattedName } = getCollectionTotalNumber(assetsGetCollections, collectionSlug)

        // console.log(chalk`{bold.hex('#EE9B00') ${collectionFormattedName}} {bold.hex('#CA6702') [${collectionLength} total items]}`);
        console.log(chalk`{bold.hex('#dac1f0') ${collectionFormattedName}} {bold.hex('#c298e7') - ${collectionSlug} [${collectionLength} total items]}`);

        //NFTs listados
        const api_url = 'https://' + apiSlug + '.medianetwork.cloud/nft_for_sale?collection=' + collectionSlug
        const assetsListed = await API_request(api_url)
        await sleep(300)

        //Total NFTs vendidos
        const api_url_sold = 'https://' + apiSlug + '.medianetwork.cloud/all_sold_per_collection?collection=' + collectionSlug
        const assetsSold = await API_request(api_url_sold)
        // console.log(typeof assetsSold);
        await sleep(300)

        // console.log(`Listed: ${assetsListed.length}`);
        // console.log(`Sold: ${assetsSold.length}`);


        //Juntamos los dos arrays originales, si assetsSold es bueno. Si no, usamos solo los assetsListed
        const assets = (() => {
            if (typeof assetsSold === 'string')
                //assetsSold mal
                return assetsListed
            else
                //assetsSold bien
                return assetsListed.concat(assetsSold)
        })();


        //Procesamos assets
        //Return de un JSON con formato (tal y como lo usamos, pero sin la parte del cáculo de rareza)
        // const { collectionData, localCounter } = await processData(assets, collectionSlug)

        //Retorna objeto
        // Si todo bien: collectionData y localCounter
        // Si error de formato traits: error
        const result = await processData(assets, collectionSlug)

        // console.log(result);

        //Si no tiene error, seguimos.
        if (!result.hasOwnProperty('error')) {

            const { collectionData, localCounter } = result

            console.log(chalk`New items fetched: {bold.hex('#24BBE4') ${localCounter.added_items} items}`);

            //Contamos nuestros items
            counter.total_items += localCounter.total_items
            counter.added_items += localCounter.added_items

            await rarityJSON(collectionData, collectionSlug)

            //Si es el último ciclo, no hace sleep
            if (collectionsToGet.indexOf(collectionSlug) < collectionsToGet.length - 1) {
                console.log(`Waiting for ${cicle_delay} ms...\n`);
                await sleep(cicle_delay)
            }
        }
        //Si el error es de formato de traits, ejecutamos con los listados únicamente.
        else if ((result.hasOwnProperty('error')) && (result.error === 'shitty trait format')) {

            counter.collections_bad_traits.push(collectionSlug)
            console.log(chalk`{bold.hex('#f56b6b') Could not obtain ${collectionSlug} collection. Error: ${result.error}.}`);
            console.log('Parsing again only with listed NFTs.\n');

            //Repetimos, solo con assetsListed
            try {
                const secondTry = true
                const { collectionData, localCounter } = await processData(assetsListed, collectionSlug, secondTry)

                console.log(chalk`New items fetched: {bold.hex('#24BBE4') ${localCounter.added_items} items}`);

                //Contamos nuestros items
                counter.total_items += localCounter.total_items
                counter.added_items += localCounter.added_items

                await rarityJSON(collectionData, collectionSlug)

                //Si es el último ciclo, no hace sleep
                if (collectionsToGet.indexOf(collectionSlug) < collectionsToGet.length - 1) {
                    console.log(`Waiting for ${cicle_delay} ms...\n`);
                    await sleep(cicle_delay)
                }
            }
            //Si da error aquí, es porque están mal los traits de los NFTs listados
            catch (error) {

                console.log(chalk`{bold.hex('#f56b6b') Impossible to obtain ${collectionSlug} collection, nor using only assetsListed.\n}`);
                counter.collections_broken.push(collectionSlug)
            }

        }
        //Si el error es de null traits, nos saltamos el resto.
        else if ((result.hasOwnProperty('error')) && (result.error === 'null traits')) {
            console.log(chalk`{bold.hex('#f56b6b') Could not obtain ${collectionSlug} collection. Error: ${result.error}.\n}`);
            counter.collections_null_traits.push(collectionSlug)
        }

    }
    //Marcador 1 de performance
    const t1 = performance.now();

    const {
        total_items, //total nfts parseados
        added_items, //total nfts nuevos añadidos
        collections_bad_traits, //nombres de colecciones con malos traits
        collections_null_traits, //nombres de colecciones sin traits cargados
        collections_broken //nombres de colecciones sin traits cargados
    } = counter

    console.log(chalk`{bold.hex('#24BBE4') \n---------------  SUMMARY  ---------------}`);
    console.log(chalk`{bold.hex('#24BBE4') ${collectionsToGet_unfiltered.length - collections_null_traits.length - collections_broken.length - filteredCollections_number}/${collectionsToGet_unfiltered.length} collections obtained in ${msToMinAndSecs(t1 - t0)} minutes}`);
    console.log(chalk`{bold.hex('#24BBE4') Total items: ${numberWithPoints(total_items)} ------ New items: ${numberWithPoints(added_items)} }`);
    console.log(chalk`{bold.hex('#f56b6b') \n---------------  UNAVAILABLE  ---------------}`);
    console.log(chalk`{bold.hex('#f56b6b') Collections with bad traits [${collections_bad_traits.length}]: ${collections_bad_traits.join(', ')} }`);
    console.log(chalk`{bold.hex('#f56b6b') Collections with null traits [${collections_null_traits.length}]: ${collections_null_traits.join(', ')} }`);
    console.log(chalk`{bold.hex('#f56b6b') Broken collections (bad traits everywhere) [${collections_broken.length}]: ${collections_broken.join(', ')} }`);
    console.log(chalk`{bold.hex('#f56b6b') Excluded collections [${filteredCollections_number}]: ${excluded_collections} }`);
    console.log(" ");


    discordSummary(
        ` \`\`Cicle delay:\`\` ${cicle_delay} ms\n\`\`Collection auto fetcher:\`\` ${collection_auto_fetcher}\n\`\`Auto query api slug:\`\` ${auto_query_api_slug}\n`,

        `\`\`Collections:\`\` **${collectionsToGet_unfiltered.length - collections_null_traits.length - collections_broken.length - filteredCollections_number}/${collectionsToGet_unfiltered.length}**\n \`\`Time:\`\` ${msToMinAndSecs(t1 - t0)} minutes\n\`\`Total items analized:\`\` ${numberWithPoints(total_items)}\n\`\`New items since last run:\`\` ${numberWithPoints(added_items)}\n`,

        `\`\`Collections with bad traits [${collections_bad_traits.length}]:\`\` ${collections_bad_traits.join(', ')}\n\`\`Collections with null traits [${collections_null_traits.length}]:\`\` ${collections_null_traits.join(', ')}\n\`\`Excluded collections [${filteredCollections_number}]:\`\` ${excluded_collections}\n\`\`Broken collections [${collections_broken.length}]:\`\` ${collections_broken.join(', ')}`
    )

}


resolve()

// https://qzlsklfacc.medianetwork.cloud/all_sold_per_collection?collection=