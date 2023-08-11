const AppState = require("./AppState.js");

// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

// TODO Maybe a bug in save/load (I end up in tutorial screen!)

// TODO Separate Zip Project.

async function init() {
    await new AppState().init();
}
init();