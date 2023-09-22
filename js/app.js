const AppState = require("./AppState.js");

// TODO Add in logging calls.

// TODO Have a class to manage workers? And then we can end them directly here instead of in "AppState.end()"?

async function init() {
    let appState = new AppState();
    try {
        await appState.init();
        console.log("AppState init finished.");
    }
    catch(err) {
        appState.end();
        console.error(err);
        process.exit(1);
    }
}
init();