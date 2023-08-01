const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Is the VoidMap ID preserved?
// TODO What if map cannot be found but it isn't a void map?

// TODO Does a void world need death and fallback maps?

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

async function init() {
    await new AppState().init();
}
init();