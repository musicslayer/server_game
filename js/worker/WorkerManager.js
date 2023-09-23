const { Worker } = require("worker_threads");

class WorkerManager {
    static workers = [];

    static errorFcn;

    static setErrorFcn(errorFcn) {
        WorkerManager.errorFcn = errorFcn;
    }

    static createWorker(workerFilePath, workerOptions) {
        let worker = new Worker(workerFilePath, workerOptions);
        worker.on("error", (err) => {
            console.error(err);
            WorkerManager?.errorFcn();
        });

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