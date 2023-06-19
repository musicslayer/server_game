const { parentPort, workerData } = require("worker_threads");

let T = process.hrtime();

foo();

function foo() {
    while(true) {
        let hrtimeDeltaArray = process.hrtime(T);
        hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];

        if(hrtimeDelta >= workerData.interval) {
            parentPort.postMessage(null);
            T = process.hrtime();
        }
    }
}