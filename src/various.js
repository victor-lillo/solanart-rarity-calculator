const fs = require('fs');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const msToMinAndSecs = (millis) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}


const msToTime = (duration) => {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

//Number with format: 127.723.900
const numberWithPoints = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}


//Devuelve un array con los items del nuevo array que no estuvieran en el array anterior.
const arrayFilter = (arrayFiltro, arrayActual) => {
    const res = arrayActual.filter(item => !arrayFiltro.includes(item));

    return res
}

//Elimina las posiciones del array previas al elemento introducido
const arrayCutter = (array, elemento) => {
    array.splice(0, array.indexOf(elemento))
}

//Crea esta estructura si no existe:
// └───results
//     ├───extension
//     └───raw
const createDirs = () => {
    const dirRaw = './results/raw';
    const dirExtension = './results/extension';

    if (!fs.existsSync(dirRaw)) {
        fs.mkdirSync(dirRaw, { recursive: true });
    }

    if (!fs.existsSync(dirExtension)) {
        fs.mkdirSync(dirExtension, { recursive: true });
    }
}


//Sacamos el total de items de la colección. Json obtenido de request get_collections
const getCollectionTotalNumber = (json, collectionSlug) => {
    for (el of json) {
        if (el.url === collectionSlug) {
            return {
                collectionLength: el.supply,
                collectionFormattedName: el.name
            }
        }
    }
}



exports.sleep = sleep
exports.msToMinAndSecs = msToMinAndSecs
exports.msToTime = msToTime
exports.numberWithPoints = numberWithPoints
exports.arrayFilter = arrayFilter
exports.arrayCutter = arrayCutter
exports.createDirs = createDirs
exports.getCollectionTotalNumber = getCollectionTotalNumber

