const AppState = require("./AppState.js");

// TODO Test serialization with new FcnName functionality.

// TODO When the entities are deserialized, they each rely on each other, so some will be outdated!

// TODO Should doMoveStep accept the direction as input, or just use the players current direction.

async function init() {
    await new AppState().init();
}
init();