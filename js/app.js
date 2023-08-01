const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Does a void world need death and fallback maps?

// TODO Can "client tasks" actually be serialized? (use player.client)

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

// TODO On logout, player.client is erased, but then how can we reference it in scheduled tasks that are still to come?

async function init() {
    await new AppState().init();
}
init();