const AppAdmin = require("./AppAdmin.js");
const AppState = require("./AppState.js");

// TODO Add in logging calls.

async function init() {
    let appState = new AppState();
    let appAdmin = new AppAdmin(appState);

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

        // Terminate anything that could prevent the program from ending properly.
        appState.terminate();
        appAdmin.terminate();
    }
}

init();