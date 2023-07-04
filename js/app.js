const AppState = require("./AppState.js");

// TODO Complete entity serialize/deserialize methods.

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO Do we need EntityFactory and WorldFactory?

// TODO serializing needs version numbers

// TODO Make sure that ALL properties are serialized, even those that are constant today but may change tomorrow.

// TODO server tasks need to be serialized, so we have to come up with a unified format.
/////// This causes player to freeze sometimes after loading state, because the task to reset the delay map was cancelled.
/////// What if there are many tasks on the same tick as the load, and we are in the middle of executing the task list?

// TODO Copy the java strategy of wrapping classes.
// TODO Allow undefined to be serialized and deserialized properly?

async function init() {
    let appState = new AppState();
    await appState.init();
}
init();