const AppState = require("./AppState.js");

// TODO Separate Zip Project.

async function init() {
    await new AppState().init();
}
init();