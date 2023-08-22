const AppState = require("./AppState.js");

async function init() {
    await new AppState().init();
}
init();