const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Merge all the XWorld, XMap, and XScreen instance classes. Do we need DynamicMap?

// TODO TileFolders and TileImages. Should it be category and name?


// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

async function init() {
    await new AppState().init();
}
init();