/**
 * DTMF decoder based on sox and multimon
 * Requires multimon, sox installed
 * libsox-fmt-mp3 for mp3 decoding
 * @author Andrey Nedobylskiy (admin@twister-vl.ru)
 */

const LDTMF = require('..');
const fs = require('fs');

const dtmf = new LDTMF();

(async function () {

    //Decode file or URL
    let decodeResult = await dtmf.decodeUri('1234567890.wav', 'wav', true);
    console.log('Decode URI result', decodeResult);

    //Decode buffer
    decodeResult = await dtmf.decodeBuffer(fs.readFileSync('1234567890.wav'), 'wav', true);
    console.log('Decode Buffer result', decodeResult);

    console.log();

    //Data from stream
    dtmf.on('data', function (data) {
        console.log('Symbol', data);
    });

    //Exit on end
    dtmf.on('end', function () {
        process.exit();
    });

    //Decode stream
    let buffer = await dtmf.createDecodeBuffer('wav');
    buffer.write(fs.readFileSync('1234567890.wav'));


})();


setInterval(function () {

}, 1000);
