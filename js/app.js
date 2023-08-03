const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)


// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

async function init() {
    await new AppState().init();
}
init();