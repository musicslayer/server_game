const AppState = require("./AppState.js");

// TODO When player logs in, get map by name, not by position
// (Dynamic maps will have to give the origin)

async function init() {
    await new AppState().init();
}
init();