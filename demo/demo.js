const LDTMF = require('..');
const fs = require('fs');

const dtmf = new LDTMF();

/*
dtmf.on('data', function (data) {
    console.log('New data ', '"' + data + '"');
});*/

function wait(time) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    })
}


(async function () {

    while (1) {
        console.log('ATTEMPT');
        let decodeResult = await dtmf.decodeBuffer(fs.readFileSync('1234567890.wav'), 'wav', true);
        console.log('Decoded result', decodeResult);
        await wait(1000);
    }


})();


setInterval(function () {

}, 1000);
