/**
 * DTMF decoder based on sox and multimon
 *
 *
 * @author Andrey Nedobylskiy (admin@twister-vl.ru)
 */

const os = require('os');
const util = require('util');
const fs = require('fs');
const {exec} = require('child_process');
const execP = util.promisify(exec);
const {EventEmitter} = require('events');

/**
 * Multimon instancer
 */
class Multimon extends EventEmitter {

    constructor(pipeName) {
        super();
        if(!pipeName) {
            pipeName = os.tmpdir() + '/multimon_pipe_' + Math.round(Math.random() * 100000);
        }

        this.pipeName = pipeName;
        this._status = 0;
    }

    /**
     * Start multimon instance
     * @return {Promise<void>}
     * @private
     */
    async _start() {
        const that = this;

        await execP('mkfifo ' + this.pipeName);

        this._status = 1;

        this._multimon = exec('multimon -v 0 -q -a DTMF -t raw ' + this.pipeName);
        this.emit('start');
        this._multimon.stdout.on('data', function (data) {
            that._inputData(data);
        });
        this._multimon.on('close', function (code) {
            that._clearFifo();
            if(this._status !== 0) {
                that.emit('close', code);
            }

            that._status = 0;
        });
    }

    /**
     * Process input multimon data
     * @param data
     * @private
     */
    _inputData(data) {
        data = String(data).trim().split("\n");
        for (let d of data) {
            this.emit('data', d.trim());
        }

    }

    /**
     * Clear pipe file
     * @return {Promise<void>}
     * @private
     */
    _clearFifo() {
        fs.unlinkSync(this.pipeName);
    }

    /**
     * Stop multimon instance
     * @return {Promise<void>}
     * @private
     */
    async _stop() {
        this._multimon.kill('SIGKILL');
        this._clearFifo();
        if(this._status !== 0) {
            this.emit('close', 0);
        }
        this._status = 0;
    }

}


module.exports = Multimon;