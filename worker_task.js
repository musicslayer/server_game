const { workerData } = require("worker_threads");

let T = process.hrtime();

while(true) {
    let hrtimeDeltaArray = process.hrtime(T);
    hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];

    if(hrtimeDelta >= workerData.interval) {
        Atomics.notify(workerData.shared, 0, 1)
        T = process.hrtime();
    }
}