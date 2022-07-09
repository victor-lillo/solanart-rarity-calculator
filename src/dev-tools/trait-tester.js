const { API_request } = require("../api-request")
const apiSlug = 'qzlsklfacc'
const { performance } = require('perf_hooks');


const resolve = async () => {

    // const api_url = 'https://' + apiSlug + '.medianetwork.cloud/nft_for_sale?collection=' + 'solanabananas'
    // console.log(" ");
    // console.log((await API_request(api_url))[0].attributes);


    const api_url_listed = 'https://' + apiSlug + '.medianetwork.cloud/nft_for_sale?collection=' + 'solpunks'
    const api_url_sold = 'https://' + apiSlug + '.medianetwork.cloud/all_sold_per_collection?collection=' + 'solpunks'

    // const assetsListed = await API_request(api_url)


    // si no incluye ':', cada palabra entre comas será un attribute x

    console.log(" ");

    const m0 = performance.now();
    const requestResponse = await API_request(api_url_listed)

    // console.log(api_url_listed);
    // console.log(api_url_sold);


    // console.log(requestResponse[0].attributes);

    const collectionData = {}

    const formatoControl = {
        control_formato_1: false,
        control_formato_2: false
    }

    for (const item of requestResponse) {

        // item.attributes es una string de los traits, tenemos que procesarlos
        const traits = {}
        console.log(item.attributes);

        if (item.attributes) {

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
                // console.log('Formato 1:', control_formato_1);
                // console.log('Formato 2:', control_formato_2, "\n");

                //So 
                if (formatoControl.control_formato_1 && formatoControl.control_formato_2) {

                    console.log("Different trait format in the collection. Pls fix this shit");
                    const m1 = performance.now();
                    console.log('Traits total: ', m1 - m0, 'milliseconds')
                    return
                }
            }


            traits['Trait Count'] = item.attributes.split(',').length

            collectionData[item.token_add] = {

                traits: traits
            }
        }
    }




    // console.log(collectionData);

    console.log(" ");

    // console.log(assetsListed[0].attributes);

}

resolve()





