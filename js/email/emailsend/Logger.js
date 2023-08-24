const TEXT_COLOR_SEND = "\u001b[1;34m" // Blue
const TEXT_COLOR_RECEIVE = "\u001b[1;32m" // Green
const TEXT_COLOR_MX = "\u001b[1;35m" // Purple

class Logger {
    domain;

    logFcn;
    isColor;

    constructor(domain, loggerOptions) {
        this.domain = domain;

        this.logFcn = loggerOptions?.logFcn ?? (() => {});
        this.isColor = loggerOptions?.isColor ?? false;
    }

    logSend(str) {
        if(this.domain) {
            str = ">>> [" + this.domain + "] " + str;
        }
        if(this.isColor) {
            str = TEXT_COLOR_SEND + str;
        }
        this.logFcn(str);
    }

    logReceive(str) {
        if(this.domain) {
            str = "<<< [" + this.domain + "] " + str;
        }
        if(this.isColor) {
            str = TEXT_COLOR_RECEIVE + str;
        }
        this.logFcn(str);
    }

    logMX(str) {
        if(this.domain) {
            str = "### [" + this.domain + "] " + str;
        }
        if(this.isColor) {
            str = TEXT_COLOR_MX + str;
        }
        this.logFcn(str);
    }
}

module.exports = Logger;