class Timer {
    static _timerArray = [];

    isFinished = false;

    _timer;

    static destroyTimers() {
        while(Timer._timerArray.length > 0) {
            try {
                clearTimeout(Timer._timerArray.pop());
            }
            finally {
            }
        }
    }

    constructor(listener, timeout) {
        this._timer = setTimeout(() => {
            if(!this.isFinished) {
                this.isFinished = true;
                listener();
            }
        }, timeout);

        Timer._timerArray.push(this._timer);
    }

    static createTimer(listener, timeout) {
        return new Timer(listener, timeout);
    }

    finish() {
        this.isFinished = true;
        clearTimeout(this._timer);
    }
}

module.exports = Timer;