const AppState = require("./AppState.js");

// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

// TODO Monster randomness is still weird.

// TODO Make html and socket_io classes

// TODO Do we even need socket_io?

async function init() {
    await new AppState().init();
}
init();