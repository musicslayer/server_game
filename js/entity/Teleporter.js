const Entity = require("./Entity.js");

class Teleporter extends Entity {
    doInteract() {
        console.log("Teleport!");
    }
}

module.exports = Teleporter;