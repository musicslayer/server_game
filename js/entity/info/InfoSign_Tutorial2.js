const Entity = require("../Entity.js");

class InfoSign_Tutorial2 extends Entity {
    getName() {
        return "Info Sign";
    }

    getEntityName() {
        return "info_sign";
    }

    getInfo() {
        // The info is a message meant for the player to read, not a description of an info sign itself.
        return "Tutorial: 0 to teleport to home location.";
    }
}

module.exports = InfoSign_Tutorial2;