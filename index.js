/**
 * DTMF decoder based on sox and multimon
 * Requires multimon, sox installed
 * libsox-fmt-mp3 for mp3 decoding
 * @author Andrey Nedobylskiy (admin@twister-vl.ru)
 */


const os = require('os');
const util = require('util');
const {exec, spawn} = require('child_process');
const execP = util.promisify(exec);
const spawnP = util.promisify(spawn);
const fs = require('fs');
const {EventEmitter} = require('events');


const Multimon = require('./lib/Multimon');
const Sox = require('./lib/Sox');


const DTMF_PATTERN = 'DTMF: ';


/**
 * LDTFM class
 */
class LDTMF extends EventEmitter {

    constructor(options) {
        super();
        this._options = options;
        this._decodedBuffer = '';
    }

    /**
     * Check depends
     * @return {Promise<boolean>}
     * @private
     */
    async _checkDepends() {
        const soxError = new Error('SoX not found');
        const multimonError = new Error('Multimon not found');

        let soxVersion, multimonVersion;

        try {
            soxVersion = (await execP('sox --version')).stdout;
        } catch (e) {
            throw  soxError;
        }
        if(soxVersion.indexOf('SoX') === -1) {
            throw soxError;
        }

        try {
            multimonVersion = (await execP('multimon')).stdout;
        } catch (e) {
            multimonVersion = e.stdout;
            if(multimonVersion.indexOf('DTMF') === -1) {
                throw multimonError;
            }
        }

        return true;
    }

    /**
     * Get or create multimon instance
     * @param pipeName
     * @return {Promise<Multimon>}
     * @private
     */
    async _getMultimon(pipeName) {
        const that = this;
        if(!this._multimonInstance) {
            await this._checkDepends();
            this._multimonInstance = new Multimon(pipeName);
            this._multimonInstance.on('data', function (data) {
                that._processMultimonData(data);
            });
            this._multimonInstance.on('close', function (data) {
                that.emit('end');
            });
        }

        if(this._multimonInstance._status === 0) {
            await this._multimonInstance._start();
        }

        return this._multimonInstance;
    }

    /**
     * Process data method
     * @param data
     * @private
     */
    _processMultimonData(data) {
        if(data.indexOf(DTMF_PATTERN) !== -1) {
            this.emit('data', data.replace(DTMF_PATTERN, '').trim());
        }
    }


    /**
     * Decode
     * @param {string} uri Decode file or url or buffer
     * @param {boolean} isBuffer True if input is a buffer
     * @param {string} type Decode data type
     * @param {boolean} returnResult Return decoded result after decoding?
     * @return {Promise<void>}
     */
    decode(uri, isBuffer, type, returnResult) {
        const that = this;
        return new Promise((resolve, reject) => {
            that._getMultimon().then(function (multimon) {

                let collectionBuffer = '';

                /**
                 * Collects data to buffer if returnResult param is true
                 * @param data
                 */
                function bufferCollector(data) {
                    collectionBuffer += data;
                }

                /**
                 * Buffer collected event
                 */
                function bufferCollected() {
                    that.removeListener('data', bufferCollector);
                    resolve(collectionBuffer);
                }

                if(returnResult) {
                    that.on('data', bufferCollector);
                }

                //Start sox for decoding
                let sox = new Sox(multimon.pipeName);

                if(isBuffer) {
                    sox.decodeBuffer(uri, type)
                } else {
                    sox.decodeUri(uri, type);
                }

                if(returnResult) {
                    sox.on('end', function () {
                        let timer = setInterval(function () {
                            if(multimon._status === 0) {
                                clearInterval(timer);
                                bufferCollected();
                            }
                        }, 1);
                    });
                } else {
                    resolve(null);
                }

            })
        });
    }

    /**
     * Decode URI
     * @param {string} uri Decode file or url
     * @param {string} type Decode data type
     * @param {boolean} returnResult Return decoded result after decoding?
     * @return {Promise<void>}
     */
    decodeUri(uri, type, returnResult) {
        return this.decode(uri, false, type, returnResult)
    }

    /**
     * Decode buffer
     * @param buffer Data buffer
     * @param {string} type Decode data type
     * @param {boolean} returnResult Return decoded result after decoding?
     * @return {Promise<void>}
     */
    decodeBuffer(buffer, type, returnResult) {
        return this.decode(buffer, true, type, returnResult);
    }

    /**
     * Create stream buffer decode
     * @param {string} type
     * @return {Promise<*>}
     */
    async createDecodeBuffer(type) {
        const that = this;
        return new Promise((resolve, reject) => {
            that._getMultimon().then(function (multimon) {
                //Start sox for decoding
                let sox = new Sox(multimon.pipeName);
                sox.startDecodeStream(type);
                resolve(sox);
            });
        });

    }

}


module.exports = LDTMF;
