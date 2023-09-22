const { Worker } = require("worker_threads");

class WorkerManager {
    static workers = [];

    static createWorker(workerFilePath, workerOptions) {
        let worker = new Worker(workerFilePath, workerOptions);
        WorkerManager.workers.push(worker);
        return worker;
    }

    static terminateAllWorkers() {
        while(WorkerManager.workers.length > 0) {
            WorkerManager.workers.shift().terminate();
        }
    }
}

module.exports = WorkerManager;