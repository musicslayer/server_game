const Constants = require("../constants/Constants.js");

class RateLimit {
    static operationIPMap = new Map();

    static init() {
        RateLimit.reset();

        setInterval(() => {
            RateLimit.reset();
        }, 1000);
    }

    static reset() {
        for(let operation of Constants.ratelimit.operationMap.keys()) {
            RateLimit.operationIPMap.set(operation, new Map());
        }
    }

    static rateLimitTask(taskName, ip, taskSuccess, taskFail) {
        let allowedOperations = Constants.ratelimit.operationMap.get(taskName);
        let ipMap = RateLimit.operationIPMap.get(taskName);
        let numOperations = ipMap?.get(ip) ?? 0;

        if(ipMap === undefined || numOperations >= allowedOperations) {
            taskFail();
        }
        else {
            numOperations++;
            ipMap.set(ip, numOperations);
    
            taskSuccess();
        }
    }
}

module.exports = RateLimit;