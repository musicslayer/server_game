const AppState = require("./AppState.js");

// TODO Performance, memory leaks, etc... (closing program takes a long time)

// TODO Does a void world need death and fallback maps?

// TODO Can I logout/login real quick and then perform a new client action mid-action? Yes :(
// --- Should "Player" class contain the delayMap?
// --- The delayMap should be reset when the action is done, not after a fixed time???
// --- delayMap is true when the action is allowed, so it's the reverse of the name

// TODO Create tutorial screen (should it be dynamic?)
// TODO Create "dynamic" world folder

// TODO TileFolders and TileImages. Should it be category and name?

// TODO When entity.owner and entity.selectedEntity are dereferenced, how do I know the entities have already been deserialized and updated?

async function init() {
    await new AppState().init();
}
init();