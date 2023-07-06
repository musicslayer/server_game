const AppState = require("./AppState.js");

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO serializing needs version numbers

// TODO Make sure that ALL properties are serialized, even those that are constant today but may change tomorrow.

// TODO Copy the java strategy of wrapping classes.

// TODO The player stored in the EntityFactory map and the Account map could be desynced...

// TODO Instead of scheduleTask and scheduleRefreshTask, maybe have an integer for the number of times something gets scheudled
///////// For example, a potion that heals 5 health every second, but only for 10 seconds.

// TODO The reader/writer classes should really be streaming classes.
// TODO We should define "reference" methods that take care of all the accessing objects from a factory map.

async function init() {
    await new AppState().init();
}
init();