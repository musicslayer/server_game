const AppState = require("./AppState.js");

// TODO When I shift worlds in an instance screen, things break!

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Merge all the XWorld, XMap, and XScreen instance classes.

// TODO delayMap is true when the action is allowed, so it's the reverse of the name

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

// TODO Now that delay map is fixed, can we keep players logged in after a "load"


// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

async function init() {
    await new AppState().init();
}
init();