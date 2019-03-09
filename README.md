# linux-DTMF decoder

DTMF decoder based on multimon and SoX.

## Dependencies 

This module requires installed multimon, Sox. For decodign mp3 files/streams, you can install libsox-fmt-mp3

For Ubuntu, Debian and Debian-based dist:

``
apt install multimon sox libsox-fmt-mp3
``

# Usage

See demo.js in demo folder

## File decoding

Supports wav, ogg and raw from scratch. MP3 supported with libsox-fmt-mp3

```javascript

const LDTMF = require('linux-dtmf');
const dtmf = new LDTMF();

let decodeResult = await dtmf.decodeUri('1234567890.wav', 'wav', true);
console.log('Decode result', decodeResult);

```

## Buffer decoding

```javascript

const LDTMF = require('linux-dtmf');
const dtmf = new LDTMF();

let dataBuffer = fs.readFileSync('1234567890.wav');

let decodeResult = await dtmf.decodeBuffer(dataBuffer, 'wav', true);
console.log('Decode result', decodeResult);

```

## Stream decoding


```javascript

const LDTMF = require('linux-dtmf');
const dtmf = new LDTMF();

let dataBuffer = fs.readFileSync('1234567890.wav');

dtmf.on('data', function (data) {
    console.log('Decoded data:', data);
});

dtmf.on('end', function () {
    console.log('Decode ended')
});

//Decode stream
let buffer = await dtmf.createDecodeBuffer('wav');
buffer.write(dataBuffer);

```

## Events

LDTMF is an event based module.

### .on('data', (data)=>{})

Decoded data

### .on('end', ()=>{})

Decoder stopped 