const AppState = require("./AppState.js");

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO Instead of scheduleTask and scheduleRefreshTask, maybe have an integer for the number of times something gets scheudled
///////// For example, a potion that heals 5 health every second, but only for 10 seconds.

// TODO We should define "reference" methods that take care of all the accessing objects from a factory map.

// TODO All Factory mappings should use a separate uid incase the object no longer uses a numeric id

// TODO All entities, screens, etc... should only store the ID of the higher object they are attached to?

// TODO When player logs in, get map by name, not by position
// (Dynamic maps will have to give the origin)

// TODO Error with Permissions-Policy header: Origin trial controlled feature not enabled: 'browsing-topics'.

// TODO When I load state, sometimes one of the monsters doesn't move.

// TODO When players despawn and respawn because of a client logout, the refreshTasks are added again without any removal, 
// so health/mana regens twice as fast!

// TODO UID vs. EntityFactory. Do we still need both?

async function init() {
    await new AppState().init();
}
init();