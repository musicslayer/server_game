const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Is the VoidMap ID preserved?
// TODO What if map cannot be found but it isn't a void map?

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

async function init() {
    await new AppState().init();
}
init();