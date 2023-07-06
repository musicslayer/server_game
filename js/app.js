const AppState = require("./AppState.js");

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO serializing needs version numbers

// TODO Make sure that ALL properties are serialized, even those that are constant today but may change tomorrow.

// TODO Copy the java strategy of wrapping classes.

// TODO When I load mid-move, I am able to immediately do another input, which shouldn't happen until the movement is done.

// The player stored in the EntityFactory map and the Account map could be desynced...

async function init() {
    await new AppState().init();
}
init();