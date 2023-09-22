const AppState = require("./AppState.js");
const WorkerManager = require("./worker/WorkerManager.js");

// TODO Add in logging calls.

async function init() {
    let appState = new AppState();
    try {
        await appState.init();
        console.log("AppState init finished.");
    }
    catch(err) {
        // Terminate the workers here so that the program can properly end.
        WorkerManager.terminateAllWorkers();
        
        console.error(err);
        process.exit(1);
    }
}
init();