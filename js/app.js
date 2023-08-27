const AppState = require("./AppState.js");

// TODO Add in logging calls.
// TODO All throw calls should use Error object.

async function init() {
    await new AppState().init();
}
init();