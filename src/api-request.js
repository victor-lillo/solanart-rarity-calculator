const axios = require('axios')
const { sleep } = require('./various')


const API_request = async (api_url) => {
    try {
        // console.log("Try...");
        const data = await axios.get(api_url)
        // console.log(data.status);
        return data.data

    } catch (error) {
        console.log(`Request failed: ${error.message}\nRetrying...\n`)
        await sleep(5000)
        API_request(api_url)
    }
}

exports.API_request = API_request