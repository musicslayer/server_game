const { parentPort, workerData } = require("worker_threads");

// TODO Use MessageChannel?
// TODO Use Atomics.wait?

let T = process.hrtime();

foo();

function foo() {
    while(true) {
        let hrtimeDeltaArray = process.hrtime(T);
        hrtimeDelta = (hrtimeDeltaArray[0] * 1000000000) + hrtimeDeltaArray[1];

        if(hrtimeDelta >= workerData.interval) {
            //if(hrtimeDelta > 19000000) {
            //    console.log("WWW: " + hrtimeDelta);
            //}

            let hrtimeDeltaArray2 = process.hrtime();

            parentPort.postMessage(hrtimeDeltaArray2);

            T = process.hrtime();
        }
    }
}