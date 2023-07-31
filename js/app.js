const AppState = require("./AppState.js");

// TODO Health Regen Potion needs to be cancelled when the player dies.

// TODO When player logs in, get map by name, not by position
// (Dynamic maps will have to give the origin)

async function init() {
    await new AppState().init();
}
init();