//Coge la respuesta de la request y la procesa a nuestro formato de JSON

const { discordError } = require("./discord")

//Return de un JSON (tal y como lo usamos, pero sin la parte del cáculo de rareza)
const processData = async (requestResponse, collectionSlug, secondTry) => {

    const localCounter = {
        total_items: 0,
        added_items: 0
    }

    //CollectionData es dinámico
    let collectionData
    try {
        collectionData = require('../results/raw/' + collectionSlug + '.json')
        //Tenemos que quitar el ranking para que al calcular la rareza no haya errores
        delete collectionData['rarity_ranking']
    } catch (error) {
        collectionData = {}
    }

    //Almacenamos en el objeto
    localCounter.added_items = Object.keys(collectionData).length

    //TODO

    const formatoControl = {
        control_formato_1: false,
        control_formato_2: false
    }

    for (item of requestResponse) {

        // item.attributes es una string de los traits, tenemos que procesarlos
        const traits = {}

        //Pueden ser de dos formatos:
        // 1) name: value, name: value, ...rest;
        // 2) value,value, ...rest;
        // 3) null
        // 4) name:value;

        // Si los traits no están cargados aún:
        // if (item.attributes === null) {

        //     // console.log("Traits are still null.");

        //     const obj_error = {
        //         name: 'Traits null error',
        //         message: `Traits not loaded yet. Check **${collectionSlug}** manually\n\n[Collection link](https://solanart.io/collections/${collectionSlug})\n[Pseudo API link](https://qzlsklfacc.medianetwork.cloud/all_sold_per_collection?collection=${collectionSlug})`
        //     }
        //     await discordError('Solanart [process-data.js]', obj_error)
        //     return { error: 'null traits' }
        // }


        //Puede haber NFTs que tengan traits null. Los ignoramos
        if (item.attributes) {
            // TODO buscar esto en los pseudo api
            //Pink Sunnies,Hair: Blonde,Hat: AWGE Trucker

            // Cuando hay varios traits: "attributes":"Hat: No Hat,Eyes: Nerd Glasses,Mouth: Sad,Accessories: No Accessories"
            if (item.attributes.includes(',')) {

                for (trait of item.attributes.split(',')) {

                    // console.log(trait);

                    if (trait.includes(': ')) {

                        const traitname = trait.split(': ')[0]
                        const traitvalue = trait.split(': ')[1]

                        traits[traitname] = traitvalue

                        formatoControl.control_formato_1 = true

                    } else {
                        const traitname = 'Attrib ' + item.attributes.split(',').indexOf(trait)
                        const traitvalue = trait

                        traits[traitname] = traitvalue

                        formatoControl.control_formato_2 = true
                    }

                    //Si hay diferencia de formatos, return
                    if (formatoControl.control_formato_1 && formatoControl.control_formato_2) {
                        // console.log("Different traits format in the collection. Pls fix this shit.");

                        //Si estamos en segundo intento, no enviamos este webhook
                        //Cuando secondTry es undefined, entramos
                        //Cuando secondTry es true, lo negamos y no entramos aquí
                        if (!secondTry ?? true) {
                            const obj_error = {
                                name: 'Traits format error',
                                message: `Different formats found. Trying **${collectionSlug}** only with listed NFTs.\n\n[Collection link](https://solanart.io/collections/${collectionSlug})\n[Pseudo API link](https://qzlsklfacc.medianetwork.cloud/all_sold_per_collection?collection=${collectionSlug})`
                            }

                            await discordError('Solanart [process-data.js]', obj_error)

                        } else {
                            const obj_error = {
                                name: 'Broken collection - Traits format error 💀',
                                message: `Different formats found in listed NFTs. **${collectionSlug}** is broken.\n\n[Collection link](https://solanart.io/collections/${collectionSlug})\n[Pseudo API link](https://qzlsklfacc.medianetwork.cloud/all_sold_per_collection?collection=${collectionSlug})`
                            }

                            await discordError('Solanart [process-data.js]', obj_error)

                        }

                        return { error: 'shitty trait format' }
                    }
                }
            }
            // Cuando solo hay un trait: "attributes": "timeline: 5" 
            else {
                const traitname = trait.split(': ')[0]
                const traitvalue = trait.split(': ')[1]

                traits[traitname] = traitvalue

            }

            traits['Trait Count'] = item.attributes.split(',').length

            collectionData[item.token_add] = {
                name: item.name,
                permalink: 'https://solanart.io/search/?token=' + item.token_add,
                address: item.seller_address,
                image_url: item.link_img,
                traits: traits
            }
        }
    }

    //Almacenamos:
    // total_items: longitud JSON reciente 
    // added_items: longitud JSON reciente - longitud JSON antiguo
    localCounter.total_items = Object.keys(collectionData).length
    localCounter.added_items = localCounter.total_items - localCounter.added_items

    // console.log(collectionData);
    return { collectionData, localCounter }

}

exports.processData = processData