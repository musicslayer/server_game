const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Does a void world need death and fallback maps?

// TODO delayMap is true when the action is allowed, so it's the reverse of the name

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

// TODO Now that delay map is fixed, can we keep players logged in after a "load"

// TODO Should "Server" or "Screen" also extend "UID".

// TODO Maybe players shouldn't actually be despawned? Can they be intangible? Or moved to another "logged out" screen?

async function init() {
    await new AppState().init();
}
init();