const path = require("path");

const Constants = require("../constants/Constants.js");
const WorkerManager = require("../worker/WorkerManager.js");

const WORKER_FILE_PATH = path.resolve(path.join(__dirname, "..", "worker", "worker_interval.js"));

class RateLimit {
    static isCancelled = false;
    static operationIPMap = new Map();

    static worker;

    static init() {
        RateLimit.reset();

        let shared = new Int32Array(new SharedArrayBuffer(4));
        RateLimit.doWork(shared);

        RateLimit.worker = WorkerManager.createWorker(WORKER_FILE_PATH, {
            workerData: {
                shared: shared,
                intervalTime: 1000000000 // 1 second, in nanoseconds
            }
        });
        // eslint-disable-next-line no-unused-vars
        RateLimit.worker.on("exit", (exitCode) => {
            RateLimit.isCancelled = true;
        });
        // eslint-disable-next-line no-unused-vars
        RateLimit.worker.on("error", (err) => {
            RateLimit.isCancelled = true;
        });
    }

    static async doWork(shared) {
        while(!RateLimit.isCancelled) {
            // We must query "value" or else this statement will not actually wait for anything.
            await Atomics.waitAsync(shared, 0, 0).value;

            RateLimit.reset();
        }
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
}

module.exports = RateLimit;