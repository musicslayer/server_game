const AppState = require("./AppState.js");

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO Instead of scheduleTask and scheduleRefreshTask, maybe have an integer for the number of times something gets scheudled
///////// For example, a potion that heals 5 health every second, but only for 10 seconds.

// TODO When player logs in, get map by name, not by position
// (Dynamic maps will have to give the origin)

// TODO Error with Permissions-Policy header: Origin trial controlled feature not enabled: 'browsing-topics'.

// TODO Now aggro is broken!

async function init() {
    await new AppState().init();
}
init();