const AppState = require("./AppState.js");

// TODO Complete entity serialize/deserialize methods.

// TODO Any code that makes files should also make folders.
// TODO Move existing save states into an archive...?

// TODO Do we need EntityFactory and WorldFactory?

// TODO serializing needs version numbers

// TODO Make sure that ALL properties are serialized, even those that are constant today but may change tomorrow.

// TODO Copy the java strategy of wrapping classes.
// TODO Allow undefined to be serialized and deserialized properly?

// TODO Rename task to fcn

async function init() {
    let appState = new AppState();
    await appState.init();
}
init();