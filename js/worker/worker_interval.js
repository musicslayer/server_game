//#EXCLUDE_REFLECTION

// This worker acts like an interval, alerting the main thread at a periodic rate, but is experimentally more precise in its timing.

const { workerData } = require("worker_threads");

let T = process.hrtime();

// eslint-disable-next-line no-constant-condition
while(true) {
    let hrtimeDeltaArray = process.hrtime(T);
    let hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];

    if(hrtimeDelta >= workerData.intervalTime) {
        Atomics.notify(workerData.shared, 0, 1)
        T = process.hrtime();
    }
}