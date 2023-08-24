class RateLimit {
    static allowedOperationsMap = new Map();
    static operationsMap = new Map();

    static init() {
        // For each operation, set the allowed number of operations per IP address and per second.
        RateLimit.allowedOperationsMap.set("html", 100);
        RateLimit.allowedOperationsMap.set("create_account", 1);
        RateLimit.allowedOperationsMap.set("create_character", 1);
        RateLimit.allowedOperationsMap.set("login", 1);
        RateLimit.allowedOperationsMap.set("input", 1000);
        RateLimit.allowedOperationsMap.set("data", 1000);
        RateLimit.allowedOperationsMap.set("dev", 1000);

        RateLimit.reset();

        setInterval(() => {
            RateLimit.reset();
        }, 1000);
    }

    static reset() {
        RateLimit.operationsMap.set("html", new Map());
        RateLimit.operationsMap.set("create_account", new Map());
        RateLimit.operationsMap.set("create_character", new Map());
        RateLimit.operationsMap.set("login", new Map());
        RateLimit.operationsMap.set("input", new Map());
        RateLimit.operationsMap.set("data", new Map());
        RateLimit.operationsMap.set("dev", new Map());
    }

    static rateLimitTask(taskName, ip, taskSuccess, taskFail) {
        let allowedOperations = RateLimit.allowedOperationsMap.get(taskName);
        let ipMap = RateLimit.operationsMap.get(taskName);
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