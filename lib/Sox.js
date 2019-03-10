/**
 * DTMF decoder based on sox and multimon
 *
 *
 * @author Andrey Nedobylskiy (admin@twister-vl.ru)
 */

const {exec} = require('child_process');
const {EventEmitter} = require('events');

const TYPES = ['raw', 'mp3', 'wav', 'ogg'];

/**
 * Sox instancer
 */
class Sox extends EventEmitter {

    constructor(pipeName) {
        super();
        if(!pipeName) {
            throw new Error('Pipe name required');
        }
        this.pipeName = pipeName;
        this._status = 0;
    }

    /**
     * Validate data type
     * @param type
     * @return {*}
     * @private
     */
    _validateType(type) {
        type = type.toLowerCase();
        if(TYPES.indexOf(type) === -1) {
            throw new Error('Invalid input type');
        }

        return type;
    }

    _assertBusy() {
        if(this._status !== 0) {
            throw new Error('Sox instance is busy');
        }
    }

    /**
     * Decode URI
     * @param {string} uri
     * @param {string} type
     */
    decodeUri(uri, type) {
        this._assertBusy();
        const that = this;
        type = this._validateType(type);
        this._run(uri, type);

    }


    /**
     * Decode buffer
     * @param {ArrayBuffer} buffer
     * @param {String} type
     */
    decodeBuffer(buffer, type) {
        this._assertBusy();
        const that = this;
        type = this._validateType(type);
        this._run('-', type);
        this._sox.stdin.write(buffer);
    }

    /**
     * Start decoding stream
     * @param {string} type
     * @param {object} options
     */
    startDecodeStream(type, options) {
        this._assertBusy();
        type = this._validateType(type);

        if(type !== 'raw') {
            this._run('-', type);
        } else {
            this._run(options, type);
        }
        return this._sox.stdin;
    }

    /**
     * Write buffer to decoder
     * @param buffer
     */
    write(buffer) {
        if(this._status === 0) {
            throw new Error('Sox is not started');
        }
        this._sox.stdin.write(buffer);
    }


    /**
     * Run sox with params
     * @param {string|object} uri
     * @param {string} type
     * @private
     */
    _run(uri, type) {
        const that = this;

        let execString;
        if(type !== 'raw') {
            execString = 'sox -t ' + type + ' "' + uri + '"  -t raw -e signed-integer -r 22050 - >';
        } else {
            let sampleRate = uri.sampleRate ? uri.sampleRate : 44100;
            let encoding = uri.encoding ? uri.encoding : 'signed-integer';
            let channels = uri.channels ? uri.channels : '1';
            let bits = uri.bits ? uri.bits : '8';
            execString = `sox -r ${sampleRate} -e ${encoding} -b ${bits} -c ${channels} -t raw -  -t raw -e signed-integer -r 22050 - >`;
        }

        this._sox = exec(execString + this.pipeName);
        this._status = 1;
        this._sox.on('close', function (code) {
            that._status = 0;
            if(code === 0) {
                that.emit('end');
            } else {
                that.emit('close', code);
            }
        });
    }


}


module.exports = Sox;