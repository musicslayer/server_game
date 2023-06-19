
const { Worker } = require("worker_threads");

//const interval = 1000000000; // 1s
//const interval = 100000000; // 100ms
//const interval = 33333333; // 33.333333ms
const interval = 16666666; // 16.6666ms

const WORKER_FILE = "./worker_task.js";

let date1 = Date.now();

async function init() {
    await workerFunc();
}
init();

async function workerFunc() {
    return new Promise(async (resolve, reject) => {
        const worker = new Worker(WORKER_FILE, {
            workerData: {
                interval: interval,
            }
        });
        worker.on("message", (arg) => {
            let date2 = Date.now();
            console.log("HRD " + (date2 - arg));

            //console.log("TIME!");

            /*
            let DD = Date.now() - date1;
            if(DD > 34) {
                //console.log("HRD " + DD);
            }
            date1 = Date.now();
            */
        })
        worker.on("exit", () => {
            resolve();
        });
        worker.on("error", (err) => {
            console.error(err);
            console.error(err.stack);
            resolve();
        });
    });
}