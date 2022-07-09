// const BigNumber = require('bignumber.js');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path')
const chalk = require('chalk');

// const testURL = 'https://opensea.io/collection/creativeartquest'


const rarityJSON = async (jsonContent, collectionSlug) => {

    const jsonUrl = "../results/raw/" + collectionSlug + '.json'
    const jsonUrl_extension = "../results/extension/" + collectionSlug + '.json'

    // console.log(jsonContent);

    //Tamaño de un objeto
    const lengthJson = Object.keys(jsonContent).length;

    // console.log(`Total obtained: ${lengthJson}`);

    //Sacamos array lista de traits
    let traitList = []

    //Une dos arrays sin repetir valores
    const mergeArrays = (...arrays) => {
        let jointArray = []

        arrays.forEach(array => {
            jointArray = [...jointArray, ...array]
        })
        const uniqueArray = jointArray.filter((item, index) => jointArray.indexOf(item) === index)
        return uniqueArray
    }


    // const m0 = performance.now();

    //Coger la cantidad total de traits
    //Hat, head, weapon, strength
    for (let index = 0; index < lengthJson; index++) {
        const arrayTraits = Object.getOwnPropertyNames(jsonContent[Object.keys(jsonContent)[index]].traits)
        // console.log(arrayTraits);
        //Método 1 para hacer lo mismo
        // traitList = mergeArrays(traitList, arrayTraits)
        arrayTraits.map(el => traitList.push(el))
    }

    traitList = [...new Set(traitList)];

    // console.log(traitList);

    // const m1 = performance.now();
    // console.log('Traits total: ', m1 - m0, 'milliseconds')

    const traitCount = {}

    //Inicializamos el objeto traitCount con los nombres de los traits
    for (el of traitList) {
        traitCount[el] = {}
    }
    // traitCount["sky"]["red"] = "1"
    // traitCount["sky"]["black"] = "10"
    // traitCount["sky"]["blue"] = "8"


    // const n0 = performance.now();


    //Recorremos cada NFT
    for (item in jsonContent) {

        //Recorremos los traits y sacamos su contenido
        for (traitName of traitList) {
            //Valor del trait. Por ejemplo: Greenflash
            const valor = jsonContent[item].traits[traitName]

            // Accedemos al número. Por ejemplo: sky:{red:1}
            // console.log(traitCount[traitName][valor])

            // Si tiene la propiedad Greenflash, +1 a su valor
            if (traitCount[traitName].hasOwnProperty(valor)) {
                traitCount[traitName][valor]++;
            }
            //Si no, inicializamos ese valor. Por ejemplo: sky:{red:1}
            else {
                traitCount[traitName][valor] = 1;
            }
        }
    }

    // const n1 = performance.now();
    // console.log('Trait count: ', n1 - n0, 'milliseconds')


    // console.log(traitCount)
    // console.log(JSON.stringify(traitCount));

    //? [Rarity Score for a Trait Value] = 1 / ([Number of Items with that Trait Value]/ [Total Number of Items in Collection])
    //? [Rarity Score for a Trait Value] = 1 / (value/ jsonContent.length)

    //Calculo estadístico rarity score
    //A cada valor le hacemos la cuenta
    const statisticalCalculation = (param) => {
        for (const i in param) {
            for (const [key, value] of Object.entries(param[i])) {
                param[i][key] = (1 / (param[i][key] / lengthJson))
            }
        }
    }
    // const s0 = performance.now();
    statisticalCalculation(traitCount)
    // const s1 = performance.now();
    // console.log('Statistical: ', s1 - s0, 'milliseconds')
    //En este punto tenemos: traitCount (peso estadístico de cada trait) y jsonContent (lista de items de una colección)

    // console.log(traitCount);

    //Creamos el array de rareza [[token_id0, rareza0],[token_id1, rareza1],...]
    const rarity_ranking = []

    //Añadimos la rareza a cada item, y ordenamos de mayor a menor según este valor
    for (index in jsonContent) {
        //Cada index es el token de un NFT
        let rarity_score = 0
        // Añadimos un elemento "rarity_score":{} al objeto
        jsonContent[index]["rarity_score"] = {}

        //Si recorremos con for...in nos da strings, hay que acceder a las entries
        for ([traitName, traitValue] of Object.entries(jsonContent[index].traits)) {
            // sword >> Steel cuyo valor es 1312
            // console.log(`${traitName} >> ${traitValue} cuyo valor es ${traitCount[traitName][traitValue]}`);

            //Sumamos todos los values de los traits
            rarity_score += traitCount[traitName][traitValue]

            // Añadimos un elemento [rarity_score][traitname] : 1312 al objeto
            jsonContent[index].rarity_score[traitName] = traitCount[traitName][traitValue]
        }

        jsonContent[index].rarity_score["TOTAL"] = rarity_score

        //Creamos [name0,token_id0, rareza0]
        const element_ranking = []
        element_ranking.push(jsonContent[index].name) //name
        element_ranking.push(index) //id
        element_ranking.push(rarity_score) //rarity_score
        rarity_ranking.push(element_ranking)
    }

    rarity_ranking.sort(function (a, b) {
        return b[2] - a[2];
    });

    //Añadimos el array rarity_ranking al objeto
    jsonContent["rarity_ranking"] = rarity_ranking
    // console.log(rarity_ranking);

    //Añadimos el rank al objeto
    //[0]Name [1]Token [2]Score [Ranking position] rarity_ranking.indexOf(element)
    for (const element of rarity_ranking) {
        // console.log(element[0]);
        jsonContent[element[1]]["rank"] = rarity_ranking.indexOf(element) + 1 //Si no, habría rank 0
    }

    //Reescribimos el objeto en la carpeta /results

    // const t0 = performance.now();
    const dateado = JSON.stringify(jsonContent);
    // const t1 = performance.now();
    // console.log('Stringify: ', t1 - t0, 'milliseconds')

    const normalizedUrl = path.join(__dirname, jsonUrl)

    // const tt0 = performance.now();
    //Write del json para Backend
    fs.writeFileSync(normalizedUrl, dateado, (err) => {
        if (err) {
            throw err;
        }
    });
    // const tt1 = performance.now();
    // console.log('Write json: ', tt1 - tt0, 'milliseconds')

    const JSON_extension = (jsonOriginal) => {
        const jsonExtension = {}
        //Sacamos la longitud del ranking y lo borramos para no recorrerlo
        jsonExtension["collection_length"] = jsonOriginal.rarity_ranking.length
        delete jsonOriginal['rarity_ranking']

        //Recorremos el objeto y asignamos dentro del name 'rank':'value'
        for (const id in jsonOriginal) {
            jsonExtension[jsonOriginal[id].name] = { "rank": jsonOriginal[id].rank }
            // jsonExtension[jsonOriginal[id].image_url.split('?')[0].slice(8)] = { "rank": jsonOriginal[id].rank }
        }

        // const og = 'https://hkgwtdvfyh.medianetwork.cloud/unsafe/600x600/filters:format(webp)/www.arweave.net/tj0BvZhanolHD2L3ocHOUgjopFgJ5LeJOSGLaD9UWuk/data.png'

        // const ext = 'https://www.arweave.net/tj0BvZhanolHD2L3ocHOUgjopFgJ5LeJOSGLaD9UWuk?ext=png'

        // console.log(ext.split('?')[0].slice(8))

        // console.log(og.includes(ext.split('?')[0].slice(8)));

        return JSON.stringify(jsonExtension)
    }


    const normalizedUrl_extension = path.join(__dirname, jsonUrl_extension)
    //Write del json para la extension
    fs.writeFileSync(normalizedUrl_extension, JSON_extension(jsonContent), (err) => {
        if (err) {
            throw err;
        }
    });

    // console.log(`\n${collectionSlug}.json successfully saved.\n`);

    // console.log(chalk`\n{bold.hex('#EE9B00') ${collectionSlug}}.json successfully saved.`);
    console.log(chalk`\n{bold.hex('#c298e7') ${collectionSlug}}.json successfully saved.`);

    //Webhook
    // `#1 of ${jsonContent.rarity_ranking.length}`
    // console.log(`3 of ${jsonContent.rarity_ranking.length} (${(3 / jsonContent.rarity_ranking.length * 100).toFixed(2)}%)`);

    //! Test console.log elemento 0 del objeto

    // console.log(" ");
    // console.log(jsonContent[Object.keys(jsonContent)[0]]);
    // console.log(jsonContent[Object.keys(jsonContent)[0]].rarity_score.TOTAL);
    // console.log(jsonContent[Object.keys(jsonContent)[0]].traits.Color);
    // console.log(" ");

    ;
}

// rarityJSON(testURL)

//Export como module
module.exports = rarityJSON