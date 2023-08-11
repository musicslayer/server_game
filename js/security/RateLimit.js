class RateLimit {
    // A map of the allowed number of operations per IP address and per second.
    static allowedOperationsMap = new Map();

    static createAccountIPMap = new Map();
    static createCharacterIPMap = new Map();
    static loginIPMap = new Map();
    static inputIPMap = new Map();
    static dataIPMap = new Map();
    static devIPMap = new Map();

    static init() {
        RateLimit.allowedOperationsMap.set("create_account", 1);
        RateLimit.allowedOperationsMap.set("create_character", 1);
        RateLimit.allowedOperationsMap.set("login", 1);
        RateLimit.allowedOperationsMap.set("input", 1000);
        RateLimit.allowedOperationsMap.set("data", 1000);
        RateLimit.allowedOperationsMap.set("dev", 1000);

        setInterval(() => {
            RateLimit.createAccountIPMap.clear();
            RateLimit.createCharacterIPMap.clear();
            RateLimit.loginIPMap.clear();
            RateLimit.inputIPMap.clear();
            RateLimit.dataIPMap.clear();
            RateLimit.devIPMap.clear();
        }, 1000);
    }

    static getIPMap(taskName) {
        let ipMap;

        switch(taskName) {
            case "create_account":
                ipMap = RateLimit.createAccountIPMap;
                break;
            case "create_character":
                ipMap = RateLimit.createCharacterIPMap;
                break;
            case "login":
                ipMap = RateLimit.loginIPMap;
                break;
            case "input":
                ipMap = RateLimit.inputIPMap;
                break;
            case "data":
                ipMap = RateLimit.dataIPMap;
                break;
            case "dev":
                ipMap = RateLimit.devIPMap;
                break;
            default:
                ipMap = undefined;
        }

        return ipMap;
    }

    static rateLimitTask(taskName, ip, taskSuccess, taskFail) {
        let ipMap = RateLimit.getIPMap(taskName);
        let allowedOperations = RateLimit.allowedOperationsMap.get(taskName);
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