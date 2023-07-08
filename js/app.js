const AppState = require("./AppState.js");

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO The player stored in the EntityFactory map and the Account map could be desynced...

// TODO Instead of scheduleTask and scheduleRefreshTask, maybe have an integer for the number of times something gets scheudled
///////// For example, a potion that heals 5 health every second, but only for 10 seconds.

// TODO The reader/writer classes should really be streaming classes.
// TODO We should define "reference" methods that take care of all the accessing objects from a factory map.

// TODO All Factory mappings should use a separate uid incase the object no longer uses a numeric id
// TODO All entities, screens, etc... should only store the ID of the higher object they are attached to?

async function init() {
    await new AppState().init();
}
init();