const AppAdmin = require("./AppAdmin.js");
const AppState = require("./AppState.js");
const WorkerManager = require("./worker/WorkerManager.js");

// Future Items:
// --- Add in logging calls. This requires more storage space.
// --- Use confirmation emails for any account changes. This requires a non-residential ISP that doesn't block port 25.

// TODO ImageCatalog -> Do we need all the switch cases? 

// TODO Inventory/Purse usage no longer works!

// TODO Do we need separate/duplicate world folders.

// TODO Entity class should just have an array of statuses?

async function init() {
    let appState = new AppState();
    let appAdmin = new AppAdmin(appState);

    let errorFcn = () => {
        // Terminate anything that could prevent the program from ending properly.
        appState.terminate();
        appAdmin.terminate();
        WorkerManager.terminateAllWorkers();
    };

    // If any admin command error then the entire program should be terminated.
    appAdmin.setErrorFcn(errorFcn);

    // If any worker errors then the entire program should be terminated.
    WorkerManager.setErrorFcn(errorFcn);

    try {
        // Initialize the app.
        await appState.init();
        console.log("AppState init finished.");

        // Allow the admin to execute commands.
        appAdmin.createConsoleInterface();
        console.log("Enter an admin command:");
    }
    catch(err) {
        console.error(err);
        errorFcn();
    }
}

init();