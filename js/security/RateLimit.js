const Constants = require("../constants/Constants.js");

class RateLimit {
    static interval;

    static operationIPMap = new Map();

    static init() {
        RateLimit.reset();

        this.interval = setInterval(() => {
            RateLimit.reset();
        }, 1000);
    }

    static reset() {
        for(let operation of Constants.ratelimit.operationMap.keys()) {
            RateLimit.operationIPMap.set(operation, new Map());
        }
    }

    static isRateLimited(taskName, ip) {
        // Returns whether the task is over the allowed rate limit for the specified IP address.
        let isRateLimited;

        let allowedOperations = Constants.ratelimit.operationMap.get(taskName);
        let ipMap = RateLimit.operationIPMap.get(taskName);
        let numOperations = ipMap?.get(ip) ?? 0;

        if(ipMap === undefined || numOperations >= allowedOperations) {
            isRateLimited = true;
        }
        else {
            isRateLimited = false;

            // The task is allowed, so record this execution in the map for subsequent checks.
            numOperations++;
            ipMap.set(ip, numOperations);
        }

        return isRateLimited;
    }

    static terminate() {
        clearInterval(RateLimit.interval);
    }
}

module.exports = RateLimit;