const AppAdmin = require("./AppAdmin.js");
const AppState = require("./AppState.js");
const WorkerManager = require("./worker/WorkerManager.js");

// Future Items:
// --- Add in logging calls. This requires more storage space.
// --- Use confirmation emails for any account changes. This requires a non-residential ISP that doesn't block port 25.

// TODO Create a new character in an account.
// TODO If Socket operations have isSuccess = false, attach an error string?

// TODO Should clientMap be using user names (or maybe also with character names) instead of key?
// --- The same user can log in with both characters, and it causes a problem because the clients would have the same key!

// TODO Implement an actual hash function

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