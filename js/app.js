const AppState = require("./AppState.js");

// TODO Add in logging calls.
// TODO Better error handling
// --- Every client action should be independent and not allow server to crash.
// --- Worker/Scheduled tasks erroring?

// TODO Clicking on empty space (so there cannot be a selected entity) errors.

async function init() {
    await new AppState().init();
}
init();