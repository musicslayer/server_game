const AppState = require("./AppState.js");

// TODO Add in logging calls.

async function init() {
    await new AppState().init();
}
init();