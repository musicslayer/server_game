const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Does a void world need death and fallback maps?

// TODO Can I logout/login real quick and then perform a new client action mid-action? Yes :(
// --- Should "Player" class contain the delayMap?

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

async function init() {
    await new AppState().init();
}
init();